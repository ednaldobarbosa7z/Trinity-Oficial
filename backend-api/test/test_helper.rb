ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module DomainTestData
  def make_user(**attributes)
    suffix = SecureRandom.hex(6)
    User.create!({ nome: "Pessoa", nickname: "pessoa_#{suffix}", email: "#{suffix}@example.com",
      password: "SenhaSegura123", password_confirmation: "SenhaSegura123" }.merge(attributes))
  end

  def make_clube(user = make_user, admin: true)
    clube = Clube.create!(nome: "Clube de testes")
    clube.membro_clubes.create!(user: user, eh_administrador: admin, data_entrada: Date.current)
    clube
  end

  def make_cycle(clube, **attributes)
    clube.ciclos.create!({ mes: 1, ano: 2026, qtd_slots: 2 }.merge(attributes))
  end

  def make_slot(ciclo, user, posicao: 1, filme: nil)
    ciclo.slots.create!(user: user, posicao: posicao, filme: filme)
  end

  def make_film(clube, user, **attributes)
    clube.filmes.create!({ titulo: "Filme", user: user, tmdb_id: SecureRandom.random_number(1_000_000).to_s }.merge(attributes))
  end

  def auth(user)
    { "Authorization" => "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
  end

  def with_replaced_method(target, method, replacement)
    original = target.method(method)
    target.define_singleton_method(method, &replacement)
    yield
  ensure
    target.define_singleton_method(method, original)
  end

  def with_replaced_instance_method(target, method, replacement)
    original = target.instance_method(method)
    target.define_method(method, &replacement)
    yield
  ensure
    target.define_method(method, original)
  end
end

class ActiveSupport::TestCase
  include DomainTestData
  # Records are built explicitly: old generated fixtures no longer match the domain.
  setup { Rails.cache.clear }
end
