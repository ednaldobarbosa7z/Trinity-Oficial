class Filme < ApplicationRecord
  belongs_to :clube
  belongs_to :user
  has_one :slot
  has_many :avaliacoes, class_name: "Avaliacao", dependent: :destroy
  normalizes :tmdb_id, with: ->(value) { value.strip.presence }

  validates :titulo, presence: true, length: { maximum: 500 }
  validates :sinopse, length: { maximum: 20_000 }
  validates :tmdb_id, uniqueness: { scope: :clube_id }, allow_nil: true
  validates :tmdb_id, format: { with: /\A[1-9]\d*\z/ }, allow_nil: true

  before_destroy :protect_slot

  private

  def protect_slot
    if Slot.exists?(filme_id: id)
      errors.add(:base, "O filme está vinculado a uma vaga.")
      throw :abort
    end
  end
end
