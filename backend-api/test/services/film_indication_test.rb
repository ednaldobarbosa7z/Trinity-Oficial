require "test_helper"

class FilmIndicationTest < ActiveSupport::TestCase
  setup do
    @user = make_user
    @clube = make_clube(@user)
    @cycle = make_cycle(@clube)
    @slot = make_slot(@cycle, @user)
  end

  test "indication is atomic when updating slot fails" do
    with_replaced_instance_method(Slot, :update!, ->(*) { raise ActiveRecord::RecordInvalid.new(self) }) do
      assert_no_difference "Filme.count" do
        assert_raises ActiveRecord::RecordInvalid do
          FilmIndication.call(clube: @clube, slot_id: @slot.id, actor: @user,
            attributes: { titulo: "Filme válido", tmdb_id: "99" })
        end
      end
      assert_nil @slot.reload.filme_id
    end
  end

  test "film cannot occupy multiple slots and filled slot cannot be overwritten" do
    FilmIndication.call(clube: @clube, slot_id: @slot.id, actor: @user,
      attributes: { titulo: "Filme", tmdb_id: "99" })
    another_slot = make_slot(@cycle, @user, posicao: 2)
    assert_no_difference "Filme.count" do
      assert_raises ApiError do
        FilmIndication.call(clube: @clube, slot_id: another_slot.id, actor: @user,
          attributes: { titulo: "Filme", tmdb_id: "99" })
      end
      assert_raises ApiError do
        FilmIndication.call(clube: @clube, slot_id: @slot.id, actor: @user,
          attributes: { titulo: "Outro", tmdb_id: "100" })
      end
    end
  end

  test "monthly distribution is balanced and has no duplicate positions" do
    2.times { @clube.membro_clubes.create!(user: make_user, eh_administrador: false) }
    cycle = MonthlyCycleCreator.call(clube: @clube, attributes: { mes: 2, ano: 2026, qtd_slots: 8 })
    assert_equal (1..8).to_a, cycle.slots.order(:posicao).pluck(:posicao)
    counts = cycle.slots.group(:user_id).count.values
    assert_equal 1, counts.max - counts.min
  end

  test "invalid number of slots never creates partial cycle" do
    assert_no_difference [ "Ciclo.count", "Slot.count" ] do
      assert_raises ActiveRecord::RecordInvalid do
        MonthlyCycleCreator.call(clube: @clube, attributes: { mes: 2, ano: 2026, qtd_slots: 101 })
      end
    end
  end
end
