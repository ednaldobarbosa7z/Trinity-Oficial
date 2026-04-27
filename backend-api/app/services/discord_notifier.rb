class DiscordNotifier
  require 'net/http'
  require 'json'

  def self.enviar(clube, mensagem, titulo_embed = nil, cor = "5814783")
    url = clube.discord_webhook_url
    
    # Se o admin ainda não configurou a URL, o código para aqui e não faz nada
    return if url.blank?

    uri = URI(url)
    
    payload = {
      content: "@everyone 📢 #{mensagem}"
    }

    if titulo_embed
      payload[:embeds] = [
        {
          title: titulo_embed,
          color: cor,
          timestamp: Time.now.iso8601
        }
      ]
    end

    begin
      Net::HTTP.post(uri, payload.to_json, "Content-Type" => "application/json")
    rescue StandardError => e
      Rails.logger.error("Erro ao enviar para o Discord: #{e.message}")
    end
  end
end