class Ciclo < ApplicationRecord
  STATUSES = %w[ABERTO FECHADO AGUARDANDO].freeze

  belongs_to :clube
  has_many :slots, dependent: :destroy
  has_many :avaliacoes, class_name: "Avaliacao", dependent: :destroy
  has_many :filmes, through: :slots
  has_many :reunioes, dependent: :destroy

  validates :mes, inclusion: { in: 1..12 }, uniqueness: { scope: [ :clube_id, :ano ] }
  validates :ano, numericality: { only_integer: true, greater_than_or_equal_to: 1900, less_than_or_equal_to: 9999 }
  validates :qtd_slots, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 100 }
  validates :status, inclusion: { in: STATUSES }
  validates :tema, length: { maximum: 500 }

  def ativo?
    status == "ABERTO"
  end
end
