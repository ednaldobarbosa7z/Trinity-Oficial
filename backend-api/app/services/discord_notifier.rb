require "net/http"
require "json"

class DiscordNotifier
  class DeliveryError < StandardError; end

  def self.valid_url?(url)
    uri = URI.parse(url.to_s)
    uri.is_a?(URI::HTTPS) && %w[discord.com discordapp.com].include?(uri.host) &&
      uri.port == 443 && uri.userinfo.nil? && uri.query.nil? && uri.fragment.nil? &&
      uri.path.match?(%r{\A/api(?:/v\d+)?/webhooks/[0-9]+/[A-Za-z0-9_-]+\z})
  rescue URI::InvalidURIError
    false
  end

  def self.enviar(clube, mensagem, titulo_embed = nil, cor = 5_814_783)
    return if clube.discord_webhook_url.blank?
    DiscordNotificationJob.perform_later(clube, mensagem, titulo_embed, cor.to_i)
  end

  def self.deliver(clube, mensagem, titulo = nil, cor = 5_814_783)
    return if clube.discord_webhook_url.blank?
    # Revalidate at delivery time, including previously stored URLs.
    raise DeliveryError, "Destino Discord inválido" unless valid_url?(clube.discord_webhook_url)

    uri = URI.parse(clube.discord_webhook_url)
    uri.query = "wait=true"
    payload = { content: mensagem.to_s.truncate(2000), allowed_mentions: { parse: [] } }
    if titulo
      payload[:embeds] = [ { title: titulo.to_s.truncate(256), color: cor.to_i.clamp(0, 0xFFFFFF),
        timestamp: Time.current.iso8601 } ]
    end
    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request.body = JSON.generate(payload)
    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true,
      open_timeout: 5, read_timeout: 5, write_timeout: 5) { |http| http.request(request) }
    raise DeliveryError, "Discord HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)
    true
  rescue IOError, SystemCallError, Timeout::Error, OpenSSL::SSL::SSLError
    # Do not leak webhook URLs (credentials) into logs or job errors.
    raise DeliveryError, "Falha de conexão com Discord"
  end
end
