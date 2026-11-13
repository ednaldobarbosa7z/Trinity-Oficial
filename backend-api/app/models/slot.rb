class Slot < ApplicationRecord
  belongs_to :ciclo
  belongs_to :filme, optional: true
  belongs_to :user, optional: true

  validates :posicao, numericality: { only_integer: true, greater_than: 0 },
    uniqueness: { scope: :ciclo_id }
  validates :filme_id, uniqueness: true, allow_nil: true
  validate :same_clube

  private

  def same_clube
    return unless ciclo
    errors.add(:filme, "deve pertencer ao mesmo clube") if filme && filme.clube_id != ciclo.clube_id
    if user && !MembroClube.exists?(clube_id: ciclo.clube_id, user_id: user.id)
      errors.add(:user, "deve participar do clube")
    end
  end
end
