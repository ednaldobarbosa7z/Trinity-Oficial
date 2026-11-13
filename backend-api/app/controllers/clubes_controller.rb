class ClubesController < ApplicationController
  def meu_clube
    render json: ClubDashboard.new(member_clube, @current_user)
  end

  def ciclo_detalhes
    ciclo = member_clube(params[:id]).ciclos.includes(slots: [ :user, :filme ])
      .find_by(mes: params[:mes], ano: params[:ano])
    return render json: { existe: false } unless ciclo

    render json: {
      id: ciclo.id, tema: ciclo.tema, status: ciclo.status,
      slots: ciclo.slots.sort_by(&:posicao).map { |slot|
        { id: slot.id, posicao: slot.posicao, user: slot.user&.as_json,
          filme: slot.filme && { id: slot.filme.id, titulo: slot.filme.titulo, poster: slot.filme.url_poster } }
      }
    }
  end

  def update_ciclo_admin
    clube = admin_clube(params[:id])
    clube.with_lock do
      ciclo = clube.ciclos.find(params[:ciclo_id])
      ciclo.with_lock do
        previous_status = ciclo.status
        ciclo.update!(params.permit(:tema, :status))
        if ciclo.status == "FECHADO" && previous_status != ciclo.status
          DiscordNotifier.enviar(clube, "O ciclo #{ciclo.mes}/#{ciclo.ano} foi encerrado.", "Ciclo encerrado")
        end
        render json: { message: "Ciclo atualizado com sucesso!", tema: ciclo.tema, status: ciclo.status }
      end
    end
  end

  def update_slot_admin
    remove = ActiveModel::Type::Boolean.new.cast(params[:remover_filme])
    raise ApiError, "Informe o filme." if !remove && params[:filme_id].blank?
    FilmIndication.call(clube: admin_clube(params[:id]), slot_id: params[:slot_id],
      actor: @current_user, existing_film_id: params[:filme_id], remove: remove, admin: true)
    render json: { message: remove ? "Filme removido com sucesso!" : "Slot atualizado com sucesso!" }
  end

  def create
    clube = nil
    @current_user.with_lock do
      clube = Clube.create!(clube_params.merge(data_criacao: Date.current))
      clube.membro_clubes.create!(user: @current_user, eh_administrador: true, data_entrada: Date.current)
    end
    render json: { clube: clube, message: "Clube criado com sucesso!" }, status: :created
  end

  def entrar
    clube = Clube.find_by!(codigo_acesso: params.require(:codigo_acesso).to_s.strip.upcase)
    clube.with_lock do
      clube.membro_clubes.create!(user: @current_user, eh_administrador: false, data_entrada: Date.current)
      DiscordNotifier.enviar(clube, "#{@current_user.nickname} entrou no clube!", "Novo membro")
    end
    render json: { clube: clube, message: "Bem-vindo ao clube!" }
  end

  def catalogo
    ciclos = paginate(member_clube.ciclos.order(ano: :desc, mes: :desc, id: :desc))
    render json: ClubCatalog.new(ciclos)
  end

  def ciclos_index
    render json: paginate(member_clube(params[:id]).ciclos.order(ano: :desc, mes: :desc, id: :desc))
  end

  def atualizar_discord
    clube = admin_clube
    clube.with_lock do
      clube.update!(discord_webhook_url: params[:discord_webhook_url].presence)
      DiscordNotifier.enviar(clube, "Integração configurada.", "Integração Discord")
    end
    render json: { message: "Configuração salva. A confirmação será enviada em segundo plano." }
  end

  private

  def clube_params
    params.require(:clube).permit(:nome, :descricao, :foto_clube)
  end
end
