class Slot < ApplicationRecord

  # --- RELACIONAMENTOS ---

  # Todo slot deve pertencer a um Ciclo (ex: "Ciclo de Terror - Outubro").
  # Sem um ciclo, o slot não faz sentido no sistema.
  belongs_to :ciclo
  
  # Relacionamento com o Filme.
  # IMPORTANTE: optional: true permite criar a vaga vazia (sem filme).
  # Isso é útil para quando o ciclo é aberto, mas o usuário ainda não escolheu o filme.
  belongs_to :filme, optional: true 
  
  # Relacionamento com o Usuário (o dono da vaga no sorteio).
  # Permite criar vaga sem dono (opcional, caso o sorteio falhe ou não tenha membros).
  # Isso evita que o sistema trave se um membro sair do clube antes do sorteio acabar.
  belongs_to :user, optional: true 

  # --- VALIDAÇÕES ---

  # Garante que o slot tenha uma ordem definida (ex: 1º filme, 2º filme...).
  # numericality garante que o valor seja um número inteiro maior que zero.
  validates :posicao, presence: true, numericality: { only_integer: true, greater_than: 0 }
end