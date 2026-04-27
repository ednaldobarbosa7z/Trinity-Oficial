class CicloSemanal < ApplicationRecord

  # --- RELACIONAMENTOS ---
  # Indica a qual clube esta semana pertence.
  belongs_to :clube

  # Relacionamento com o Filme da semana.
  # optional: true -> Permite criar o planejamento da semana (tema e data) 
  # mesmo que o filme ainda não tenha sido sorteado ou escolhido.
  belongs_to :filme, optional: true 

  # --- VALIDAÇÕES ---
  # Identificador da semana (ex: Semana 1, Semana 2...).
  validates :numero_semana, presence: true

  # Data de início (geralmente a segunda-feira ou o dia da reunião do clube).
  validates :data_inicio_semana, presence: true

  # O título ou "mood" da semana (ex: "Semana dos Clássicos de Terror").
  validates :nome_tema_semana, presence: true
end