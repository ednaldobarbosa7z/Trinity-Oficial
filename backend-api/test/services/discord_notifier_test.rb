require "test_helper"

class DiscordNotifierTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  test "only exact HTTPS Discord webhook destinations are allowed" do
    assert DiscordNotifier.valid_url?("https://discord.com/api/webhooks/123/token_ABC-123")
    assert DiscordNotifier.valid_url?("https://discordapp.com/api/v10/webhooks/123/token")
    [ "http://discord.com/api/webhooks/1/token", "https://discord.com.evil.test/api/webhooks/1/token",
      "https://discord.com@127.0.0.1/api/webhooks/1/token", "https://discord.com:8443/api/webhooks/1/token",
      "https://127.0.0.1/api/webhooks/1/token", "https://discord.com/api/webhooks/1/token?redirect=1",
      "https://discord.com/api/webhooks/1/token#fragment", "invalid" ].each do |url|
      refute DiscordNotifier.valid_url?(url), url
    end
  end

  test "delivery has bounded timeouts numeric colors and disables mentions" do
    clube = make_clube
    clube.update!(discord_webhook_url: "https://discord.com/api/webhooks/123/fake_token")
    response = Net::HTTPNoContent.new("1.1", "204", "No Content")
    observed = nil
    http = Object.new
    http.define_singleton_method(:request) { |request| observed = request; response }
    test_case = self
    replacement = ->(host, port, **options, &block) {
      test_case.assert_equal "discord.com", host
      test_case.assert_equal 443, port
      test_case.assert_equal 5, options[:read_timeout]
      test_case.assert_equal 5, options[:open_timeout]
      block.call(http)
    }
    with_replaced_method(Net::HTTP, :start, replacement) do
      assert DiscordNotifier.deliver(clube, "@everyone teste", "Título", "123")
    end
    payload = JSON.parse(observed.body)
    assert_equal 123, payload.dig("embeds", 0, "color")
    assert_equal [], payload.dig("allowed_mentions", "parse")
  end

  test "HTTP error and redirects do not report delivery success or follow redirects" do
    clube = make_clube
    clube.update!(discord_webhook_url: "https://discord.com/api/webhooks/123/fake_token")
    response = Net::HTTPFound.new("1.1", "302", "Found")
    http = Object.new
    http.define_singleton_method(:request) { |*| response }
    with_replaced_method(Net::HTTP, :start, ->(*, **, &block) { block.call(http) }) do
      assert_raises DiscordNotifier::DeliveryError do
        DiscordNotifier.deliver(clube, "Teste")
      end
    end
  end

  test "notification is discarded when surrounding transaction rolls back" do
    clube = make_clube
    clube.update!(discord_webhook_url: "https://discord.com/api/webhooks/123/fake_token")
    assert_no_enqueued_jobs do
      Clube.transaction(requires_new: true) do
        DiscordNotifier.enviar(clube, "Não deve enviar")
        raise ActiveRecord::Rollback
      end
    end
  end
end
