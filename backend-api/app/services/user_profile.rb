class UserProfile
  def initialize(user:, viewer:, clube:, page: 1, per_page: 50)
    @user, @viewer, @clube = user, viewer, clube
    @page = [ page.to_i, 1 ].max
    @per_page = per_page.to_i.clamp(1, 100)
  end

  def as_json(*)
    evaluations = @user.avaliacoes
    evaluations = evaluations.joins(:ciclo).where(ciclos: { clube_id: @clube.id }) unless @user == @viewer
    count = evaluations.count
    movie_count = evaluations.distinct.count(:filme_id)
    films = @user.filmes
    films = films.where(clube: @clube) unless @user == @viewer
    controversial = Avaliacao.where(filme_id: films.select(:id)).group(:filme_id)
      .having("COUNT(*) >= 3 AND MAX(nota) - MIN(nota) >= 2.5").limit(1).count.any?
    messages = Avaliacao.joins(:filme).where(filmes: { user_id: @user.id })
      .where.not(recado_indicacao: [ nil, "" ]).where.not(user: @user)
    messages = messages.where(filmes: { clube_id: @clube.id }) unless @user == @viewer

    {
      user: UserPresenter.new(@user, private_profile: @user == @viewer).as_json,
      clube: @clube ? { nome: @clube.nome, codigo: @clube.codigo_acesso } : nil,
      amigos: @clube ? @clube.users.order(:id).limit(100).map(&:as_json) : [],
      recados_recebidos: page(messages).includes(:user, :filme).map { |av|
        { id: av.id, autor: av.user.nickname, filme_titulo: av.filme.titulo, nota: av.nota, texto: av.recado_indicacao }
      },
      conquistas: { primeiro_play: count >= 1, cinefilo_veterano: count >= 10, curador_polemico: controversial },
      stats: { total_avaliacoes: count, total_filmes_assistidos: movie_count },
      pagination: { page: @page, per_page: @per_page, total_avaliacoes: count, total_recados: messages.count },
      avaliacoes: page(evaluations).includes(:filme).map { |av|
        av.attributes.slice("id", "nota", "comentario", "destaque", "assistiria_novamente", "created_at").merge(
          filme: { titulo: av.filme.titulo, poster: av.filme.url_poster, ano: av.filme.ano_lancamento })
      }
    }
  end

  private

  def page(scope)
    scope.order(created_at: :desc, id: :desc).limit(@per_page).offset((@page - 1) * @per_page)
  end
end
