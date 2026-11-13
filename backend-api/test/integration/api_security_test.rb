require "test_helper"

class ApiSecurityTest < ActionDispatch::IntegrationTest
  setup do
    @admin = make_user
    @clube = make_clube(@admin)
    @member = make_user
    @clube.membro_clubes.create!(user: @member, eh_administrador: false)
    @outsider = make_user
    @other_clube = make_clube(@outsider)
    @cycle = make_cycle(@clube)
    @other_cycle = make_cycle(@other_clube)
    @film = make_film(@clube, @member)
    @slot = make_slot(@cycle, @member, filme: @film)
    @other_slot = make_slot(@other_cycle, @outsider)
  end

  test "missing malformed expired and wrong algorithm tokens return 401" do
    tokens = [ nil, "invalido",
      JsonWebToken.encode({ user_id: @admin.id }, 1.minute.ago),
      JWT.encode({ user_id: @admin.id, exp: 1.hour.from_now.to_i }, Rails.application.secret_key_base, "HS384"),
      JWT.encode({ user_id: @admin.id }, Rails.application.secret_key_base, "HS256"),
      JWT.encode({ exp: 1.hour.from_now.to_i }, Rails.application.secret_key_base, "HS256"),
      JsonWebToken.encode(user_id: 0) ]
    tokens.each do |token|
      get "/users/perfil", headers: token ? { "Authorization" => "Bearer #{token}" } : {}
      assert_response :unauthorized
      assert_equal [ "Acesso não autorizado." ], response.parsed_body["errors"]
    end
    get "/users/perfil", headers: { "Authorization" => "Basic #{JsonWebToken.encode(user_id: @admin.id)}" }
    assert_response :unauthorized
  end

  test "private and public profile never expose password or private email" do
    get "/users/perfil", headers: auth(@admin)
    assert_response :success
    assert_equal @admin.email, response.parsed_body.dig("user", "email")
    refute_includes response.body, "password_digest"

    get "/users/#{@member.id}/perfil_publico", headers: auth(@admin)
    assert_response :success
    refute response.parsed_body["user"].key?("email")
    refute_includes response.body, "password_digest"
  end

  test "club and nested users never expose webhook or password" do
    get "/clubes/meu_clube", headers: auth(@admin)
    assert_response :success
    refute_includes response.body, "discord_webhook_url"
    refute_includes response.body, "password_digest"
    refute response.parsed_body["membros"].first.key?("email")
  end

  test "stats require authentication and membership" do
    get "/clubes/#{@clube.id}/statistics"
    assert_response :unauthorized
    get "/clubes/#{@clube.id}/statistics", headers: auth(@outsider)
    assert_response :not_found
    get "/clubes/#{@clube.id}/statistics", headers: auth(@member)
    assert_response :success
  end

  test "only club admin creates monthly cycle" do
    payload = { mes: 2, ano: 2026, qtd_slots: 3 }
    post "/clubes/#{@clube.id}/ciclos/mensal", params: payload, headers: auth(@member), as: :json
    assert_response :forbidden
    post "/clubes/#{@clube.id}/ciclos/mensal", params: payload, headers: auth(@outsider), as: :json
    assert_response :not_found
    assert_difference [ "Ciclo.count" ], 1 do
      assert_difference [ "Slot.count" ], 3 do
        post "/clubes/#{@clube.id}/ciclos/mensal", params: payload, headers: auth(@admin), as: :json
        assert_response :created
        refute_includes response.body, "password_digest"
      end
    end
  end

  test "admin cannot modify another clubs cycle or slot" do
    put "/clubes/#{@clube.id}/update_ciclo_admin",
      params: { ciclo_id: @other_cycle.id, status: "FECHADO" }, headers: auth(@admin), as: :json
    assert_response :not_found
    assert_equal "ABERTO", @other_cycle.reload.status
    put "/clubes/#{@clube.id}/update_slot_admin",
      params: { slot_id: @other_slot.id, remover_filme: true }, headers: auth(@admin), as: :json
    assert_response :not_found
  end

  test "indication slot must belong to URL club" do
    post "/clubes/#{@clube.id}/salvar_filme/#{@other_slot.id}",
      params: { titulo: "Outra indicação", tmdb_id: "1234" }, headers: auth(@member), as: :json
    assert_response :not_found
    assert_nil @other_slot.reload.filme_id
  end

  test "cannot review film outside cycle or another club" do
    unused_film = make_film(@clube, @admin)
    assert_no_difference "Avaliacao.count" do
      post "/avaliacoes", params: { avaliacao: { ciclo_id: @cycle.id, filme_id: unused_film.id,
        nota: 4, comentario: "Ótimo" } }, headers: auth(@member), as: :json
      assert_response :unprocessable_entity
      post "/avaliacoes", params: { avaliacao: { ciclo_id: @other_cycle.id, filme_id: @film.id,
        nota: 4, comentario: "Ótimo" } }, headers: auth(@member), as: :json
      assert_response :not_found
    end
  end

  test "reviews and likes are restricted to club members" do
    evaluation = @cycle.avaliacoes.create!(user: @member, filme: @film, nota: 4, comentario: "Ótimo")
    get "/avaliacoes/filme/#{@film.id}", headers: auth(@outsider)
    assert_response :not_found
    post "/avaliacoes/#{evaluation.id}/toggle_like", headers: auth(@outsider)
    assert_response :not_found
    assert_no_difference "CurtidaAvaliacao.count" do
      post "/avaliacoes/#{evaluation.id}/toggle_like", headers: auth(@admin)
      assert_response :success
      assert_equal true, response.parsed_body["curtido"]
      post "/avaliacoes/#{evaluation.id}/toggle_like", headers: auth(@admin)
      assert_response :success
      assert_equal false, response.parsed_body["curtido"]
    end
  end

  test "closed cycles reject reviews and indications" do
    @cycle.update!(status: "FECHADO")
    post "/avaliacoes", params: { avaliacao: { ciclo_id: @cycle.id, filme_id: @film.id,
      nota: 4, comentario: "Ótimo" } }, headers: auth(@member), as: :json
    assert_response :unprocessable_entity
    slot = make_slot(@cycle, @member, posicao: 2)
    post "/clubes/#{@clube.id}/salvar_filme/#{slot.id}",
      params: { titulo: "Outro filme", tmdb_id: "1234" }, headers: auth(@member), as: :json
    assert_response :unprocessable_entity
    assert_nil slot.reload.filme_id
  end

  test "rated film cannot be removed or replaced by admin" do
    @cycle.avaliacoes.create!(user: @member, filme: @film, nota: 4, comentario: "Ótimo")
    put "/clubes/#{@clube.id}/update_slot_admin",
      params: { slot_id: @slot.id, remover_filme: true }, headers: auth(@admin), as: :json
    assert_response :unprocessable_entity
    assert_equal @film.id, @slot.reload.filme_id
  end

  test "empty slots and users without club are handled" do
    @slot.update!(user: nil)
    get "/clubes/meu_clube", headers: auth(@admin)
    assert_response :success
    empty_user = make_user
    get "/clubes/catalogo", headers: auth(empty_user)
    assert_response :not_found
    get "/users/perfil", headers: auth(empty_user)
    assert_response :success
  end

  test "webhook rejects arbitrary destinations without sending a request" do
    put "/clubes/discord", params: { discord_webhook_url: "http://127.0.0.1:3000/up" },
      headers: auth(@admin), as: :json
    assert_response :unprocessable_entity
    assert_nil @clube.reload.discord_webhook_url
  end

  test "meetings require administration and nested ownership" do
    post "/ciclos/#{@cycle.id}/reunioes", params: { reuniao: { titulo: "Sessão",
      data_hora: 1.day.from_now.iso8601, tipo: "Online", link_ou_local: "https://example.com" } },
      headers: auth(@member), as: :json
    assert_response :forbidden
    meeting = @other_cycle.reunioes.create!(titulo: "Sessão", data_hora: 1.day.from_now, tipo: "Presencial")
    delete "/ciclos/#{@cycle.id}/reunioes/#{meeting.id}", headers: auth(@admin)
    assert_response :not_found
    assert Reuniao.exists?(meeting.id)
  end

  test "pagination preserves array response and publishes total count" do
    get "/clubes/#{@clube.id}/ciclos", params: { page: 1, per_page: 1 }, headers: auth(@admin)
    assert_response :success
    assert_kind_of Array, response.parsed_body
    assert_equal "1", response.headers["X-Total-Count"]
    assert_equal "1", response.headers["X-Per-Page"]
    get "/clubes/#{@clube.id}/ciclos", params: { page: 2, per_page: 1 }, headers: auth(@admin)
    assert_equal [], response.parsed_body
  end

  test "email normalized on login and bad credentials return generic 401" do
    post "/auth/login", params: { email: "  #{@admin.email.upcase}  ", password: "SenhaSegura123" }, as: :json
    assert_response :success
    assert response.parsed_body["token"]
    post "/auth/login", params: { email: @admin.email, password: "errada" }, as: :json
    assert_response :unauthorized
  end

  test "login rate limit rejects repeated attempts" do
    10.times do
      post "/auth/login", params: { email: "missing@example.com", password: "errada" }, as: :json
      assert_response :unauthorized
    end
    post "/auth/login", params: { email: "missing@example.com", password: "errada" }, as: :json
    assert_response :too_many_requests
  end

  test "registration enforces email and password and returns safe JSON" do
    post "/users", params: { user: { nome: "Novo", nickname: "novo", email: "sem_email", password: "curta" } }, as: :json
    assert_response :unprocessable_entity
    assert_kind_of Array, response.parsed_body["errors"]
    post "/users", params: { user: { nome: "Novo", nickname: "novo", email: "  NOVO@example.com  ",
      password: "SenhaSegura123", password_confirmation: "SenhaSegura123" } }, as: :json
    assert_response :created
    assert_equal "novo@example.com", response.parsed_body.dig("user", "email")
    assert_equal false, response.parsed_body.dig("user", "has_club")
    refute_includes response.body, "password_digest"
  end

  test "public profile only includes common clubs data" do
    hidden_club = make_clube(@member)
    hidden_cycle = make_cycle(hidden_club)
    hidden_film = make_film(hidden_club, @member, titulo: "Título privado")
    make_slot(hidden_cycle, @member, filme: hidden_film)
    hidden_cycle.avaliacoes.create!(user: @member, filme: hidden_film, nota: 4, comentario: "Crítica privada")
    get "/users/#{@member.id}/perfil_publico", headers: auth(@admin)
    assert_response :success
    refute_includes response.body, "Título privado"
    assert_equal 0, response.parsed_body.dig("stats", "total_avaliacoes")
  end
end
