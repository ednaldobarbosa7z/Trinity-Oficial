class Ciclo < ApplicationRecord

  # --- RELACIONAMENTOS ---
  # O ciclo pertence a um clube (ex: Ciclo de Janeiro do Clube "Cineastas").
  belongs_to :clube
  
  # Um ciclo é composto por várias vagas (slots) onde os filmes serão sorteados ou escolhidos.
  # Se o ciclo for deletado, os slots também são removidos.
  has_many :slots, dependent: :destroy
  
  # CORREÇÃO CRÍTICA: Mapeamento manual para evitar que o Rails busque por "Avaliaco".
  # Permite acessar todas as avaliações feitas dentro deste ciclo específico.
  has_many :avaliacoes, class_name: 'Avaliacao', dependent: :destroy 
  
  # Atalho para listar todos os filmes que estão participando deste ciclo 
  # navegando através dos slots.
  has_many :filmes, through: :slots

  has_many :reunioes, dependent: :destroy

  # --- VALIDAÇÕES ---
  # Garante que o mês seja um número válido de calendário (1 a 12).
  validates :mes, presence: true, inclusion: { in: 1..12 }

  # Garante que o ano de referência esteja presente.
  validates :ano, presence: true

  # Define quantos filmes/vagas esse ciclo terá (ex: 4 filmes por mês).
  # Deve ser sempre um número maior que zero.
  validates :qtd_slots, presence: true, numericality: { greater_than: 0 }

  # --- MÉTODOS DE INSTÂNCIA (Helpers) ---
  # Método auxiliar para verificar rapidamente se o ciclo ainda aceita indicações ou votos.
  def ativo?
    status == 'ABERTO'
  end
end