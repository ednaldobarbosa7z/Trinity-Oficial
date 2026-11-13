require "test_helper"

class DomainIntegrityTest < ActiveSupport::TestCase
  setup do
    @user = make_user
    @clube = make_clube(@user)
    @cycle = make_cycle(@clube)
  end

  test "normalization and case insensitive uniqueness" do
    other = User.new(nome: "Outro", nickname: @user.nickname.upcase, email: "  #{@user.email.upcase} ",
      password: "SenhaSegura123")
    refute other.valid?
    assert other.errors[:email].any?
    assert other.errors[:nickname].any?
  end

  test "password only validated when set" do
    @user.update!(nome: "Novo nome")
    refute @user.update(password: "curta")
    assert @user.authenticate("curta")
    assert User.find(@user.id).authenticate("SenhaSegura123")
  end

  test "database prevents duplicate club membership" do
    assert_raises ActiveRecord::RecordNotUnique do
      MembroClube.transaction(requires_new: true) do
        MembroClube.insert_all!([ { user_id: @user.id, clube_id: @clube.id, eh_administrador: false,
          created_at: Time.current, updated_at: Time.current } ])
      end
    end
  end

  test "database prevents duplicate cycles" do
    assert_raises ActiveRecord::RecordNotUnique do
      Ciclo.transaction(requires_new: true) do
        Ciclo.insert_all!([ { clube_id: @clube.id, mes: @cycle.mes, ano: @cycle.ano, qtd_slots: 1,
          created_at: Time.current, updated_at: Time.current } ])
      end
    end
  end

  test "database prevents invalid month even when validations bypassed" do
    assert_raises ActiveRecord::StatementInvalid do
      Ciclo.transaction(requires_new: true) { @cycle.update_columns(mes: 13) }
    end
  end

  test "slot can be unassigned and rejects foreign club user or film" do
    slot = @cycle.slots.create!(posicao: 1)
    assert_nil slot.user_id
    outsider = make_user
    other_clube = make_clube(outsider)
    slot.user = outsider
    refute slot.valid?
    slot.user = @user
    slot.filme = make_film(other_clube, outsider)
    refute slot.valid?
  end

  test "deleting an occupied film is refused and deleting club removes its domain safely" do
    film = make_film(@clube, @user)
    make_slot(@cycle, @user, filme: film)
    @cycle.avaliacoes.create!(user: @user, filme: film, nota: 4, comentario: "Bom")
    @cycle.reunioes.create!(titulo: "Sessão", data_hora: Time.current, tipo: "Online")
    refute film.destroy
    @clube.destroy!
    refute Filme.exists?(film.id)
    refute Ciclo.exists?(@cycle.id)
    assert User.exists?(@user.id)
  end

  test "slot and rating duplicate keys are enforced by database" do
    film = make_film(@clube, @user)
    slot = make_slot(@cycle, @user, filme: film)
    evaluation = @cycle.avaliacoes.create!(user: @user, filme: film, nota: 4, comentario: "Bom")
    [ [ Slot, slot ], [ Avaliacao, evaluation ] ].each do |model, record|
      attributes = record.attributes.except("id")
      assert_raises ActiveRecord::RecordNotUnique do
        model.transaction(requires_new: true) { model.insert_all!([ attributes ]) }
      end
    end
  end
end
