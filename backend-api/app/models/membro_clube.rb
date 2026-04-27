class MembroClube < ApplicationRecord

   # --- RELACIONAMENTOS ---

  # Indica que cada registro desta tabela liga um Clube específico...
  belongs_to :clube

  # ...a um Usuário específico.
  belongs_to :user

  # Nota Técnica:
  # Esta tabela é usada pelo modelo User através do comando 'through: :membro_clubes'.
  # Ela permite que você saiba, por exemplo, a data em que o usuário entrou no clube
  # caso você decida adicionar um campo 'created_at' nela no futuro.
end