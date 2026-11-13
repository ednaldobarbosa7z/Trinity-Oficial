require "test_helper"

class CatalogTest < ActionDispatch::IntegrationTest
  setup do
    @admin = make_user
    @member = make_user
    @clube = make_clube(@admin)
    @clube.membro_clubes.create!(user: @member, eh_administrador: false)
    @cycle = make_cycle(@clube)
    @film = make_film(@clube, @admin)
    make_slot(@cycle, @admin, filme: @film)
    @cycle.avaliacoes.create!(user: @admin, filme: @film, nota: 2, comentario: "Regular", assistiria_novamente: false)
    @cycle.avaliacoes.create!(user: @member, filme: @film, nota: 5, comentario: "Ótimo", assistiria_novamente: true)
  end

  test "catalog aggregates reviews correctly and keeps response shape" do
    get "/clubes/catalogo", headers: auth(@admin)
    assert_response :success
    movie = response.parsed_body.first.fetch("filmes").first
    assert_equal 3.5, movie.dig("stats", "media_geral")
    assert_equal 2, movie.dig("stats", "total_avaliacoes")
    assert_equal 50, movie.dig("stats", "porcentagem_rewatch")
    assert_equal 2, movie["avaliacoes"].length
    refute_includes response.body, "password_digest"
  end

  test "profile pagination includes total received messages" do
    @cycle.avaliacoes.find_by!(user: @member).update!(recado_indicacao: "Boa indicação!")
    get "/users/perfil", headers: auth(@admin)
    assert_response :success
    assert_equal 1, response.parsed_body.dig("pagination", "total_recados")
    assert_equal 1, response.parsed_body["recados_recebidos"].length
  end

  test "review list counts likes and identifies current user in a batch" do
    review = @cycle.avaliacoes.find_by!(user: @member)
    review.curtidas.create!(user: @admin)
    get "/avaliacoes/filme/#{@film.id}", headers: auth(@admin)
    assert_response :success
    data = response.parsed_body.find { |entry| entry["id"] == review.id }
    assert_equal 1, data["curtidas_count"]
    assert_equal true, data["curtido_por_mim"]
    refute data["user"].key?("email")
    assert_equal "2", response.headers["X-Total-Count"]
  end

  test "dashboard batches user reviews and contains meeting data" do
    @cycle.reunioes.create!(titulo: "Sessão", data_hora: Time.current, tipo: "Online")
    get "/clubes/meu_clube", headers: auth(@admin)
    assert_response :success
    data = response.parsed_body
    assert_equal 2, data.dig("ciclo_atual", "slots", 0, "minha_avaliacao", "nota")
    assert_equal "Sessão", data.dig("ciclo_atual", "reunioes", 0, "titulo")
  end

  test "nested serialization cannot bypass safe fields" do
    @clube.update!(discord_webhook_url: "https://discord.com/api/webhooks/123/fake_token")
    data = @film.as_json(include: [ :user, :clube ])
    refute data.fetch("user").key?("password_digest")
    refute data.fetch("user").key?("email")
    refute data.fetch("clube").key?("discord_webhook_url")
    assert_equal true, data.dig("clube", "discord_configurado")
  end
end
