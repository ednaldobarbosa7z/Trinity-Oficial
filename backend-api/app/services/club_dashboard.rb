class ClubDashboard
  def initialize(clube, user)
    @clube, @user = clube, user
  end

  def as_json(*)
    ciclo = @clube.ciclos.where(status: "ABERTO").includes(:reunioes, slots: [ :user, :filme ])
      .order(created_at: :desc, id: :desc).first
    evaluations = ciclo ? ciclo.avaliacoes.where(user: @user).index_by(&:filme_id) : {}
    current = if ciclo
      {
        id: ciclo.id, mes: ciclo.mes, ano: ciclo.ano, tema: ciclo.tema, status: ciclo.status,
        slots: ciclo.slots.sort_by(&:posicao).map { |slot|
          evaluation = evaluations[slot.filme_id]
          { id: slot.id, posicao: slot.posicao, user: slot.user&.as_json, filme: slot.filme,
            minha_avaliacao: evaluation && { id: evaluation.id, nota: evaluation.nota } }
        },
        reunioes: ciclo.reunioes.sort_by(&:data_hora)
      }
    end

    indications = Slot.joins(:ciclo).where(ciclos: { clube_id: @clube.id }).where.not(filme_id: nil)
      .includes(:user, :filme).order(updated_at: :desc, id: :desc).limit(10).map { |slot|
        { tipo: "indicacao", user_id: slot.user_id, user: slot.user&.nickname || "Membro",
          avatar: slot.user&.url_foto_perfil, filme: slot.filme.titulo, data: slot.updated_at }
      }
    reviews = Avaliacao.joins(:ciclo).where(ciclos: { clube_id: @clube.id })
      .includes(:user, :filme).order(created_at: :desc, id: :desc).limit(10).map { |av|
        { tipo: "avaliacao", user_id: av.user_id, user: av.user.nickname,
          avatar: av.user.url_foto_perfil, filme: av.filme.titulo, nota: av.nota, data: av.created_at }
      }
    {
      clube: @clube, membros: @clube.users.order(:id).limit(100),
      sou_admin: @clube.membro_clubes.exists?(user: @user, eh_administrador: true),
      meu_id: @user.id, ciclo_atual: current,
      atividades: (indications + reviews).sort_by { |item| item[:data] }.reverse.first(15)
    }
  end
end
