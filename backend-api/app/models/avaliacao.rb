class Avaliacao < ApplicationRecord
  belongs_to :user
  belongs_to :filme
  belongs_to :ciclo
  has_many :curtidas, class_name: "CurtidaAvaliacao", dependent: :destroy

  validates :nota, inclusion: { in: [ 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0 ] }
  validates :comentario, presence: true, length: { maximum: 10_000 }
  validates :destaque, length: { maximum: 100 }
  validates :recado_indicacao, length: { maximum: 5000 }
  validates :user_id, uniqueness: { scope: [ :filme_id, :ciclo_id ] }
  validate :valid_context, on: :create

  private

  def valid_context
    return unless ciclo && filme && user
    errors.add(:ciclo, "está fechado") unless ciclo.ativo?
    unless ciclo.clube_id == filme.clube_id && ciclo.slots.exists?(filme_id: filme.id)
      errors.add(:filme, "não participa deste ciclo")
    end
    unless MembroClube.exists?(clube_id: ciclo.clube_id, user_id: user.id)
      errors.add(:user, "não participa deste clube")
    end
  end
end
