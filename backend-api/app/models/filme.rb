class Filme < ApplicationRecord

  # --- RELACIONAMENTOS ---

  # O filme está vinculado a um clube específico.
  belongs_to :clube

  # Indica o "Curador" (o usuário que cadastrou ou sugeriu o filme no sistema).
  belongs_to :user 

  # Se o filme for selecionado para uma rodada, ele ocupa um Slot (vaga) no ciclo.
  has_one :slot    # O filme pertence a um slot (se já foi escolhido)
  
  # --- RELACIONAMENTOS 1:N & INTEGRIDADE ---
  # Define que um filme pode ter várias notas/comentários.
  # class_name: 'Avaliacao' -> Corrige a pluralização do Rails (evita buscar 'Avaliaco').
  # dependent: :destroy -> Se o filme for apagado, as avaliações dele também são removidas do banco.
  has_many :avaliacoes, class_name: 'Avaliacao', dependent: :destroy
  
  # --- VALIDAÇÕES ---
  # O título é obrigatório para qualquer exibição no Frontend.
  validates :titulo, presence: true

  # --- REGRA DE OURO ---
  # Impede duplicatas: o mesmo filme (tmdb_id) não pode ser adicionado duas vezes no MESMO clube.
  # O 'scope' restringe a unicidade apenas dentro do clube_id atual.
  # 'allow_nil: true' permite filmes manuais que não vieram do TMDB (sem ID externo).
  validates :tmdb_id, uniqueness: { scope: :clube_id, message: "já foi adicionado neste clube" }, allow_nil: true
end