class Clube < ApplicationRecord
  has_many :membro_clubes, dependent: :destroy
  has_many :users, through: :membro_clubes
  # Remove slots and reviews before their films, avoiding FK violations.
  has_many :ciclos, dependent: :destroy
  has_many :filmes, dependent: :destroy

  validates :nome, presence: true, length: { maximum: 150 }
  validates :descricao, length: { maximum: 5000 }
  validates :codigo_acesso, uniqueness: true, allow_nil: true
  validate :valid_webhook, if: :will_save_change_to_discord_webhook_url?
  before_validation :gerar_codigo_acesso, on: :create

  def dono
    membro_clubes.find_by(eh_administrador: true)&.user
  end

  def serializable_hash(options = nil)
    super((options || {}).merge(only: %w[id nome codigo_acesso descricao data_criacao foto_clube created_at updated_at],
      include: nil, methods: nil)).merge("discord_configurado" => discord_webhook_url.present?)
  end

  private

  def valid_webhook
    if discord_webhook_url.present? && !DiscordNotifier.valid_url?(discord_webhook_url)
      errors.add(:discord_webhook_url, "deve ser um webhook HTTPS válido do Discord")
    end
  end

  def gerar_codigo_acesso
    self.codigo_acesso ||= loop do
      code = SecureRandom.alphanumeric(6).upcase
      break code unless self.class.exists?(codigo_acesso: code)
    end
  end
end
