class Reuniao < ApplicationRecord
  belongs_to :ciclo

  # Validações para não deixar salvar dados em branco
  validates :titulo, :data_hora, :tipo, presence: true
  validates :tipo, inclusion: { in: %w[Online Presencial], message: "%{value} não é um tipo válido. Escolha Online ou Presencial." }
end