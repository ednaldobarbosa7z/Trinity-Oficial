class ClubCatalog
  def initialize(ciclos)
    @ciclos = ciclos.includes(slots: [ :user, :filme ]).to_a
  end

  def as_json(*)
    ids = @ciclos.map(&:id)
    scope = Avaliacao.where(ciclo_id: ids)
    aggregate = scope.group(:ciclo_id, :filme_id).pluck(:ciclo_id, :filme_id,
      Arel.sql("COUNT(*)"), Arel.sql("AVG(nota)"),
      Arel.sql("SUM(CASE WHEN assistiria_novamente THEN 1 ELSE 0 END)"),
      Arel.sql("MAX(nota) - MIN(nota)")).to_h { |cycle, film, *stats| [ [ cycle, film ], stats ] }
    ranked = scope.select("avaliacaos.*, ROW_NUMBER() OVER (PARTITION BY ciclo_id, filme_id ORDER BY created_at DESC, id DESC) AS review_position")
    reviews = Avaliacao.from(ranked, :avaliacaos).where("review_position <= 50").includes(:user)
      .order(created_at: :desc, id: :desc).group_by { |av| [ av.ciclo_id, av.filme_id ] }

    @ciclos.filter_map do |ciclo|
      slots = ciclo.slots.select(&:filme)
      next if slots.empty?
      {
        mes: ciclo.mes, ano: ciclo.ano, tema: ciclo.tema,
        filmes: slots.sort_by(&:posicao).map { |slot|
          filme = slot.filme
          count, average, rewatch, spread = aggregate.fetch([ ciclo.id, filme.id ], [ 0, 0, 0, 0 ])
          {
            id: filme.id, titulo: filme.titulo, ano: filme.ano_lancamento,
            poster: filme.url_poster, backdrop: filme.url_backdrop, sinopse: filme.sinopse,
            indicado_por: { id: slot.user_id, nickname: slot.user&.nickname || "Desconhecido" },
            stats: { media_geral: average.to_f.round(1), total_avaliacoes: count,
              porcentagem_rewatch: count.positive? ? (rewatch.to_f / count * 100).round : 0,
              is_polemico: count > 2 && spread.to_f >= 2.5 },
            avaliacoes: reviews.fetch([ ciclo.id, filme.id ], []).map { |av|
              av.attributes.slice("id", "nota", "comentario", "destaque", "assistiria_novamente").merge(
                user: { id: av.user_id, nickname: av.user.nickname, foto: av.user.url_foto_perfil })
            }
          }
        }
      }
    end
  end
end
