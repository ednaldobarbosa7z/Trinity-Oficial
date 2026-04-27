class Avaliacao < ApplicationRecord

  # --- RELACIONAMENTOS ---
  # Quem escreveu a avaliação.
  belongs_to :user

  # Qual filme está sendo avaliado.
  belongs_to :filme

  # Em qual contexto (mês/ano) essa avaliação foi feita.
  belongs_to :ciclo

  # Sistema de Social: Uma avaliação pode receber várias curtidas.
  # class_name: Especifica o model correto para evitar erros de pluralização.
  # dependent: :destroy: Se a avaliação for apagada, as curtidas somem junto (limpeza de banco).
  has_many :curtidas, class_name: 'CurtidaAvaliacao', dependent: :destroy

  # --- VALIDAÇÕES DE NOTA (ESTILO LETTERBOXD) ---
  # Garante que o usuário use apenas os valores permitidos (passos de 0.5).
  # Isso facilita a renderização de "estrelas" ou "meias-estrelas" no seu Angular.
  validates :nota, inclusion: { 
    in: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0],
    message: "deve ser uma nota válida entre 0.5 e 5.0"
  }

  # Obriga o usuário a escrever algo, evitando avaliações vazias.
  validates :comentario, presence: true

  # O 'destaque' é aquela frase de impacto que aparece no card do filme (limite de 100 caracteres).
  validates :destaque, length: { maximum: 100 } # Frase curta pro destaque

  # --- REGRA DE INTEGRIDADE ---
  # Impede que o mesmo usuário avalie o mesmo filme múltiplas vezes dentro do mesmo ciclo.
  # O scope duplo [:filme_id, :ciclo_id] cria uma trava de segurança robusta no banco.
  validates :user_id, uniqueness: { scope: [:filme_id, :ciclo_id], message: "já avaliou este filme." }
end