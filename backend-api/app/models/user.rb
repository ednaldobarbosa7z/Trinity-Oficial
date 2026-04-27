class User < ApplicationRecord
  # --- SEGURANÇA E AUTENTICAÇÃO ---
  # Habilita o suporte a senhas seguras. Exige um campo 'password_digest' no banco.
  # Ele lida automaticamente com a criptografia e a confirmação de senha.
  has_secure_password

  # --- RELACIONAMENTOS N:N (Muitos para Muitos) ---
  # O usuário não pertence ao clube diretamente; ele pertence através da tabela 'membro_clubes'.
  has_many :membro_clubes
  has_many :clubes, through: :membro_clubes

  # --- RELACIONAMENTOS 1:N (Um para Muitos) ---
  # Filmes que este usuário cadastrou/indicou no sistema.
  has_many :filmes
  
  # Relacionamento com o sistema de sorteio de filmes do clube.
  # Adicione isso para garantir que o sorteio funcione bem
  has_many :slots

  # --- CONFIGURAÇÕES DE NOMENCLATURA (Aliasing) ---
  # O Rails por padrão tentaria buscar a classe "Avaliaco" (singular de Avaliacoes).
  # Usamos class_name para forçar o Rails a usar a classe correta 'Avaliacao'.
  has_many :avaliacoes, class_name: 'Avaliacao'
  
  # Aqui definimos que o usuário pode ter várias curtidas, mas no código 
  # chamamos de 'curtidas_feitas' para ficar mais claro o papel do usuário.
  has_many :curtidas_feitas, class_name: 'CurtidaAvaliacao'
  
  # --- VALIDAÇÕES DE DADOS ---
  # Garante que o email seja único e obrigatório.
  validates :email, presence: true, uniqueness: true

  # Nome real do usuário.
  validates :nome, presence: true

  # Nickname único (usado para menções e no perfil).
  validates :nickname, presence: true, uniqueness: true

  # Validação customizada para a foto de perfil:
  # Permite que fique em branco, mas se preenchido, deve ser uma URL válida.
  validates :url_foto_perfil, allow_blank: true, format: { 
    with: %r{\Ahttps?://.+\z}i, 
    message: "deve ser um link válido (começando com http:// ou https://)" 
  }
end