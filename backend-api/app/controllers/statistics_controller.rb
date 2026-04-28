class StatisticsController < ApplicationController
  def index
    # Capturamos o clube específico da rota
    @clube = Clube.find(params[:clube_id])

    # 1. TOP 10 FILMES DO CLUBE
    # Filtramos apenas os filmes que pertencem ao clube_id
    filmes_clube = Filme.where(clube_id: @clube.id)
                        .joins(:avaliacoes)
                        .select('filmes.*, AVG(avaliacaos.nota) as media_nota')
                        .group('filmes.id')

    top_10 = filmes_clube.order('media_nota DESC').limit(10)
    
    # 2. O PIOR FILME DO CLUBE
    pior_filme = filmes_clube.order('media_nota ASC').limit(1).first

    # 3. MEMBROS MAIS GENEROSOS (Deste Clube)
    # Filtramos as avaliações feitas nos filmes que pertencem a este clube
    usuarios_generosos = User.joins(avaliacoes: :filme)
                             .where(filmes: { clube_id: @clube.id })
                             .select('users.*, AVG(avaliacaos.nota) as media_nota, COUNT(avaliacaos.id) as total_avaliacoes')
                             .group('users.id')
                             .order('media_nota DESC')
                             .limit(5)

    render json: {
      clube: @clube.nome,
      top_10: formatar_filmes(top_10),
      pior_filme: pior_filme ? formatar_filmes([pior_filme]).first : nil,
      mais_generosos: usuarios_generosos.map do |user|
        {
          id: user.id,
          nome: user.nome, #
          nickname: user.nickname, #
          foto_perfil: user.url_foto_perfil, #
          media_dada: user.media_nota.to_f.round(2),
          total_avaliacoes: user.total_avaliacoes
        }
      end
    }, status: :ok
  end

  private

  def formatar_filmes(filmes)
    filmes.map do |filme|
      {
        id: filme.id,
        titulo: filme.titulo, #
        poster: filme.url_poster, #
        media: filme.media_nota.to_f.round(2)
      }
    end
  end
end