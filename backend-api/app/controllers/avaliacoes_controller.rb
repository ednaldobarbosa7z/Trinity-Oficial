class AvaliacoesController < ApplicationController
  def create
    attributes = params.require(:avaliacao).permit(:filme_id, :ciclo_id, :nota,
      :comentario, :destaque, :recado_indicacao, :assistiria_novamente)
    ciclo = accessible_ciclos.find(attributes[:ciclo_id])
    filme = accessible_filmes.find(attributes[:filme_id])
    avaliacao = nil
    ciclo.with_lock do
      avaliacao = ciclo.avaliacoes.create!(attributes.except(:ciclo_id, :filme_id).merge(
        filme: filme, user: @current_user))
      DiscordNotifier.enviar(ciclo.clube, "#{@current_user.nickname} avaliou #{filme.titulo} com nota #{avaliacao.nota}.",
        "Nova crítica", 16_766_720)
    end
    render json: avaliacao, status: :created
  end

  def index_por_filme
    filme = accessible_filmes.find(params[:filme_id])
    avaliacoes = paginate(filme.avaliacoes.includes(:user).order(created_at: :desc, id: :desc)).to_a
    ids = avaliacoes.map(&:id)
    counts = CurtidaAvaliacao.where(avaliacao_id: ids).group(:avaliacao_id).count
    mine = CurtidaAvaliacao.where(avaliacao_id: ids, user: @current_user).pluck(:avaliacao_id).to_set

    render json: avaliacoes.map { |av|
      av.attributes.slice("id", "nota", "comentario", "destaque", "recado_indicacao",
        "assistiria_novamente", "created_at").merge(
          user: UserPresenter.new(av.user).as_json,
          curtidas_count: counts.fetch(av.id, 0), curtido_por_mim: mine.include?(av.id))
    }
  end
end
