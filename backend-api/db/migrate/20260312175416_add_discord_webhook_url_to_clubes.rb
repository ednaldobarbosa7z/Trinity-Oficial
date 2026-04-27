class AddDiscordWebhookUrlToClubes < ActiveRecord::Migration[8.0]
  def change
    add_column :clubes, :discord_webhook_url, :string
  end
end
