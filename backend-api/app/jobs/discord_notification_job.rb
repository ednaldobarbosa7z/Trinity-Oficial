class DiscordNotificationJob < ApplicationJob
  retry_on DiscordNotifier::DeliveryError, wait: :polynomially_longer, attempts: 5

  def perform(clube, mensagem, titulo = nil, cor = 5_814_783)
    DiscordNotifier.deliver(clube, mensagem, titulo, cor)
  end
end
