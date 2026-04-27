class ClubesController < ApplicationController
  before_action :authorize_request

  # GET /clubes/meu_clube
  # Carrega a "Home" do clube para o usuário logado.
  def meu_clube
    @clube = @current_user.clubes.first

    if @clube
      membro = MembroClube.find_by(user: @current_user, clube: @clube)
      
      # 1. BUSCA O CICLO ATIVO: Onde as indicações e notas estão acontecendo agora.
      ciclo = @clube.ciclos.where(status: 'ABERTO')
                           .includes(:reunioes, slots: [:user, :filme])
                           .order(created_at: :desc)
                           .first

      # 2. PROCESSA OS DADOS DO CICLO: Verifica se o usuário já avaliou cada filme.
      ciclo_formatado = nil

      if ciclo
        slots_formatados = ciclo.slots.order(:posicao).map do |slot|
          minha_avaliacao = if slot.filme
                              Avaliacao.find_by(user: @current_user, filme: slot.filme, ciclo: ciclo)
                            else
                              nil
                            end

          {
            id: slot.id,
            posicao: slot.posicao,
            user: { 
              id: slot.user.id, 
              nickname: slot.user.nickname,
              url_foto_perfil: slot.user.url_foto_perfil
            },
            filme: slot.filme,
            minha_avaliacao: minha_avaliacao ? { id: minha_avaliacao.id, nota: minha_avaliacao.nota } : nil
          }
        end

ciclo_formatado = {
          id: ciclo.id,
          mes: ciclo.mes,
          ano: ciclo.ano,
          tema: ciclo.tema,
          status: ciclo.status,
          slots: slots_formatados,
          # 👇 ADICIONE ESTA PARTE DAS REUNIÕES 👇
          reunioes: ciclo.reunioes.order(data_hora: :asc).map do |r|
            {
              id: r.id,
              titulo: r.titulo,
              data_hora: r.data_hora,
              tipo: r.tipo,
              link_ou_local: r.link_ou_local
            }
          end
        }
end
      # 🕵️‍♂️ O DETETIVE DE FOFOCAS: CONSTRUINDO O FEED DE ATIVIDADES
      # A) Busca as 10 indicações de filmes mais recentes.
      ultimas_indicacoes = Slot.joins(:ciclo)
                               .where(ciclos: { clube_id: @clube.id })
                               .where.not(filme_id: nil)
                               .includes(:user, :filme)
                               .order(updated_at: :desc)
                               .limit(10)
                               .map do |slot|
                                 {
                                   tipo: 'indicacao',
                                   user_id: slot.user&.id, # <--- ADICIONE ESTA LINHA
                                   user: slot.user&.nickname || 'Membro',
                                   avatar: slot.user&.url_foto_perfil,
                                   filme: slot.filme.titulo,
                                   data: slot.updated_at
                                 }
                               end

      # B) Busca as 10 notas/avaliações mais recentes dadas por membros do clube.
      ultimas_avaliacoes = Avaliacao.joins(:filme)
                                    .where(filmes: { clube_id: @clube.id })
                                    .includes(:user, :filme)
                                    .order(created_at: :desc)
                                    .limit(10)
                                    .map do |av|
                                      {
                                        tipo: 'avaliacao',
                                        user_id: av.user&.id, # <--- ADICIONE ESTA LINHA
                                        user: av.user&.nickname || 'Membro',
                                        avatar: av.user&.url_foto_perfil,
                                        filme: av.filme.titulo,
                                        nota: av.nota,
                                        data: av.created_at
                                      }
                                    end

      # C) Junta e ordena: Cria um feed cronológico unificado.
      feed_atividades = (ultimas_indicacoes + ultimas_avaliacoes)
                          .sort_by { |ativ| ativ[:data] }
                          .reverse
                          .first(15)
                          
      render json: { 
        clube: @clube,
        membros: @clube.users.select(:id, :nome, :nickname, :url_foto_perfil),
        sou_admin: membro&.eh_administrador,
        meu_id: @current_user.id,
        ciclo_atual: ciclo_formatado,
        atividades: feed_atividades # <-- Enviamos o Feed Real aqui!
      }, status: :ok
    else
      render json: { error: 'Usuário não possui clube' }, status: :not_found
    end
  end

  # GET /clubes/ciclo_detalhes/:mes/:ano
  def ciclo_detalhes
    clube = @current_user.clubes.first
    return render json: { error: 'Clube não encontrado' }, status: :not_found unless clube

    ciclo = clube.ciclos.find_by(mes: params[:mes], ano: params[:ano])

    if ciclo
      render json: {
        id: ciclo.id,
        tema: ciclo.tema,
        status: ciclo.status,
        slots: ciclo.slots.includes(:user, :filme).order(:posicao).map { |s|
          {
            id: s.id,
            posicao: s.posicao,
            user: { id: s.user.id, nickname: s.user.nickname },
            filme: s.filme ? { 
              id: s.filme.id, 
              titulo: s.filme.titulo, 
              poster: s.filme.url_poster 
            } : nil
          }
        }
      }
    else
      render json: { existe: false }, status: :ok
    end
  end

  # PUT /clubes/update_ciclo_admin
  # Permite ao admin mudar o tema do mês ou fechar o ciclo.
  def update_ciclo_admin
    clube = @current_user.clubes.first
    membro = MembroClube.find_by(user: @current_user, clube: clube)
    
    return render json: { error: 'Acesso negado' }, status: :forbidden unless membro&.eh_administrador

    ciclo = Ciclo.find(params[:ciclo_id])
    status_anterior = ciclo.status

    if ciclo.update(tema: params[:tema], status: params[:status])
      
      # GATILHO DISCORD: Avisa o servidor se o ciclo foi encerrado.
      if params[:status] == 'FECHADO' && status_anterior != 'FECHADO'
        DiscordNotifier.enviar(
          clube, 
          "As cortinas fecharam! As avaliações de #{ciclo.mes}/#{ciclo.ano} já estão disponíveis no Catálogo Geral.", 
          "Ciclo Encerrado 🎬",
          "15158332" 
        )
      end

      render json: { message: 'Ciclo atualizado com sucesso!', tema: ciclo.tema, status: ciclo.status }
    else
      render json: { errors: ciclo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PUT /clubes/update_slot_admin
  def update_slot_admin
    clube = @current_user.clubes.first
    membro = MembroClube.find_by(user: @current_user, clube: clube)
    
    return render json: { error: 'Acesso negado' }, status: :forbidden unless membro&.eh_administrador

    slot = Slot.find(params[:slot_id])
    
    if params[:remover_filme]
      if slot.filme_id.present? && Avaliacao.exists?(filme_id: slot.filme_id, ciclo_id: slot.ciclo_id)
        return render json: { 
          error: 'Não é possível remover este filme pois ele já possui avaliações no mural.' 
        }, status: :unprocessable_entity
      end

      filme_removido = slot.filme.titulo
      dono_do_slot = slot.user.nickname

      slot.update(filme_id: nil)

      begin
        if clube.discord_webhook_url.present?
          DiscordNotifier.enviar(
            clube, 
            "O Admin usou o Martelo da Justiça! 🔨\nO filme **#{filme_removido}** indicado por **#{dono_do_slot}** foi removido da mesa.\n\n@#{dono_do_slot}, por favor, acesse o site e indique um novo filme que siga o tema!", 
            "Aviso de Moderação",
            "15548997" 
          )
        end
      rescue => e
        Rails.logger.error "Aviso: Falha ao notificar o Discord (Remoção): #{e.message}"
      end

      render json: { message: 'Filme removido com sucesso!' }
    else
      slot.update(filme_id: params[:filme_id])
      render json: { message: 'Slot atualizado com sucesso!' }
    end
  end

  # POST /clubes
  # Criação de um novo clube e já define o criador como Administrador.
  def create
    ActiveRecord::Base.transaction do
      @clube = Clube.new(clube_params)
      @clube.data_criacao = Date.today
      
      if @clube.save
        MembroClube.create!(
          user: @current_user,
          clube: @clube,
          eh_administrador: true,
          data_entrada: Date.today
        )
        render json: { clube: @clube, message: 'Clube criado com sucesso!' }, status: :created
      else
        render json: { errors: @clube.errors.full_messages }, status: :unprocessable_entity
        raise ActiveRecord::Rollback 
      end
    end
  end

  # POST /clubes/entrar
  # Permite novos usuários entrarem via código de 6 dígitos.
  def entrar
    codigo = params[:codigo_acesso]&.upcase 
    @clube = Clube.find_by(codigo_acesso: codigo)

    if @clube
      if MembroClube.exists?(user: @current_user, clube: @clube)
        render json: { error: 'Você já faz parte deste clube!' }, status: :unprocessable_entity
        return
      end

      MembroClube.create!(
        user: @current_user,
        clube: @clube,
        eh_administrador: false, 
        data_entrada: Date.today
      )

      begin
        if @clube.discord_webhook_url.present?
          DiscordNotifier.enviar(
            # Notifica no Discord que alguém novo entrou.
            @clube, 
            "As portas abriram-se! 🚪 Dêem as boas-vindas a **#{@current_user.nickname}**, o mais novo membro do clube!", 
            "Sangue Novo no Pedaço!",
            "5763719" 
          )
        end
      rescue => e
        Rails.logger.error "Aviso: Falha ao notificar o Discord (Entrada): #{e.message}"
      end

      render json: { clube: @clube, message: 'Bem-vindo ao clube!' }, status: :ok
    else
      render json: { error: 'Código de acesso inválido.' }, status: :not_found
    end
  end


  # GET /clubes/catalogo
  # O "Museu" do clube: Agrupa todos os ciclos passados e calcula médias e polêmicas.
  def catalogo
    clube = @current_user.clubes.first
    
    ciclos = clube.ciclos.includes(slots: [ :user, { filme: { avaliacoes: :user } } ]).order(ano: :desc, mes: :desc)

    catalogo_agrupado = ciclos.map do |ciclo|
      slots_com_filme = ciclo.slots.select { |s| s.filme.present? }
      
      next if slots_com_filme.empty?

      {
        mes: ciclo.mes,
        ano: ciclo.ano,
        tema: ciclo.tema,
        filmes: slots_com_filme.map do |slot|
          filme = slot.filme
          avaliacoes = filme.avaliacoes.to_a
          
          media = avaliacoes.any? ? (avaliacoes.sum(&:nota).to_f / avaliacoes.size).round(1) : 0
          rewatch_count = avaliacoes.count { |av| av.assistiria_novamente }
          
          notas = avaliacoes.map(&:nota)
          is_polemico = avaliacoes.size > 2 && (notas.max - notas.min >= 2.5)

          {
            id: filme.id,
            titulo: filme.titulo,
            ano: filme.ano_lancamento,
            poster: filme.url_poster,
            backdrop: filme.url_backdrop,
            sinopse: filme.sinopse,
            indicado_por: {
              id: slot.user&.id, # <--- 🐛 CORREÇÃO: ID DE QUEM INDICOU ADICIONADO AQUI
              nickname: slot.user&.nickname || 'Desconhecido'
            },
            stats: {
              media_geral: media,
              total_avaliacoes: avaliacoes.size,
              porcentagem_rewatch: avaliacoes.any? ? ((rewatch_count.to_f / avaliacoes.size) * 100).round : 0,
              is_polemico: is_polemico
            },
            avaliacoes: avaliacoes.map do |av|
              {
                id: av.id,
                nota: av.nota,
                comentario: av.comentario,
                destaque: av.destaque,
                assistiria_novamente: av.assistiria_novamente,
                user: {
                  id: av.user&.id, # <--- 🐛 CORREÇÃO: ID DE QUEM AVALIOU ADICIONADO AQUI
                  nickname: av.user&.nickname,
                  foto: av.user&.url_foto_perfil
                }
              }
            end
          }
        end
      }
    end.compact

    render json: catalogo_agrupado
  end

  # GET /clubes/:id/ciclos
  def ciclos_index
    clube = Clube.find(params[:id])
    @ciclos = clube.ciclos.order(ano: :desc, mes: :desc)
    render json: @ciclos
  end

  # PUT /clubes/discord
  def atualizar_discord
    clube = @current_user.clubes.first
    membro = MembroClube.find_by(user: @current_user, clube: clube)

    if membro && membro.eh_administrador?
      if clube.update(discord_webhook_url: params[:discord_webhook_url])
        DiscordNotifier.enviar(clube, "O Oráculo foi conectado ao servidor com sucesso!", "Integração Concluída")
        render json: { message: "Webhook salvo e testado com sucesso!" }, status: :ok
      else
        render json: { error: "Erro ao salvar a URL" }, status: :unprocessable_entity
      end
    else
      render json: { error: "Apenas administradores podem configurar o Discord." }, status: :unauthorized
    end
  end

  private

  def clube_params
    params.require(:clube).permit(:nome, :descricao, :foto_clube)
  end
end