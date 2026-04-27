class CurtidaAvaliacao < ApplicationRecord
  # --- RELACIONAMENTOS ---
  # Indica quem é o autor da "curtida". 
  # No seu modelo User, isso é referenciado como 'curtidas_feitas'.
  belongs_to :user

  # Indica qual resenha/comentário está recebendo o "joinha".
  belongs_to :avaliacao

  # --- VALIDAÇÕES DE INTEGRIDADE ---
  # REGRA DE NEGÓCIO: Um usuário não pode curtir a mesma resenha mais de uma vez.
  # O 'scope' garante que a combinação [user_id + avaliacao_id] seja única no banco de dados.
  # Se o usuário tentar curtir de novo, o Rails impedirá a criação do registro.
  validates :user_id, uniqueness: { scope: :avaliacao_id }
end