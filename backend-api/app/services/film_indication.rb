class FilmIndication
  # Lock order is always club -> cycle -> slot, including administrative changes.
  def self.call(clube:, slot_id:, actor:, attributes: nil, existing_film_id: nil, remove: false, admin: false)
    clube.with_lock do
      slot = Slot.joins(:ciclo).where(ciclos: { clube_id: clube.id }).find(slot_id)
      slot.ciclo.with_lock do
        slot.lock!
        raise ApiError, "Este ciclo não aceita alterações." unless slot.ciclo.ativo?
        unless admin || slot.user_id == actor.id
          raise ApiError.new("Sem permissão para indicar neste slot.", status: :forbidden)
        end
        if slot.filme_id && Avaliacao.exists?(filme_id: slot.filme_id, ciclo_id: slot.ciclo_id)
          raise ApiError, "O filme já possui avaliações e não pode ser substituído."
        end

        if remove
          raise ApiError, "Esta vaga já está vazia." unless slot.filme_id
          slot.update!(filme: nil)
        else
          raise ApiError, "Esta vaga já foi preenchida." if slot.filme_id && !admin
          filme = if existing_film_id.present?
            clube.filmes.find(existing_film_id)
          else
            raise ApiError, "A vaga precisa ter um responsável." unless slot.user
            tmdb_id = attributes[:tmdb_id].presence
            existing = clube.filmes.find_by(tmdb_id: tmdb_id) if tmdb_id
            existing || clube.filmes.new(attributes.merge(user: slot.user))
          end
          if filme.persisted? && Slot.where(filme_id: filme.id).where.not(id: slot.id).exists?
            raise ApiError, "Este filme já foi indicado em outra vaga."
          end
          filme.save! if filme.new_record?
          slot.update!(filme: filme)
        end
        DiscordNotifier.enviar(clube, remove ? "Uma indicação foi removida." :
          "#{actor.nickname} indicou #{slot.filme.titulo}.", "Indicações do clube")
        slot
      end
    end
  end
end
