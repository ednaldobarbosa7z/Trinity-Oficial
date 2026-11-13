class User < ApplicationRecord
  has_secure_password

  has_many :membro_clubes, dependent: :destroy
  has_many :clubes, through: :membro_clubes
  has_many :filmes, dependent: :restrict_with_error
  has_many :slots, dependent: :nullify
  has_many :avaliacoes, class_name: "Avaliacao", dependent: :restrict_with_error
  has_many :curtidas_feitas, class_name: "CurtidaAvaliacao", dependent: :destroy

  normalizes :email, with: ->(email) { email.strip.downcase }
  normalizes :nickname, with: ->(nickname) { nickname.strip }
  validates :email, presence: true, length: { maximum: 254 },
    format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: { case_sensitive: false }
  validates :nome, presence: true, length: { maximum: 150 }
  validates :nickname, presence: true, length: { maximum: 50 }, uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 8 }, allow_nil: true
  validates :url_foto_perfil, allow_blank: true,
    format: { with: %r{\Ahttps?://[^\s]+\z}i }, length: { maximum: 2048 }

  # Safe even when a user is serialized through a nested association.
  def serializable_hash(options = nil)
    super((options || {}).merge(only: %w[id nome nickname url_foto_perfil], include: nil, methods: nil))
  end
end
