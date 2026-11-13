require "test_helper"

class ConcurrentWritesTest < ActiveSupport::TestCase
  self.use_transactional_tests = false

  setup do
    @user = make_user
    @clube = make_clube(@user)
    @cycle = make_cycle(@clube)
    @slot = make_slot(@cycle, @user)
  end

  teardown do
    @clube.destroy! if @clube&.persisted?
    @user.destroy! if @user&.persisted?
  end

  test "simultaneous indications persist one film and one assignment" do
    results = race do
      FilmIndication.call(clube: Clube.find(@clube.id), slot_id: @slot.id, actor: User.find(@user.id),
        attributes: { titulo: "Mesmo filme", tmdb_id: "12345" })
    end
    assert_equal 1, results.count { |result| result.is_a?(Slot) }, results.inspect
    assert_equal 1, results.count { |result| result.is_a?(ApiError) }, results.inspect
    assert_equal 1, @clube.filmes.count
    assert @slot.reload.filme_id
  end

  test "simultaneous monthly draws cannot duplicate cycles" do
    results = race do
      MonthlyCycleCreator.call(clube: Clube.find(@clube.id),
        attributes: { mes: 2, ano: 2026, qtd_slots: 2 })
    end
    assert_equal 1, results.count { |result| result.is_a?(Ciclo) }, results.inspect
    assert_equal 1, results.count { |result| result.is_a?(ActiveRecord::RecordInvalid) }, results.inspect
    assert_equal 1, @clube.ciclos.where(mes: 2, ano: 2026).count
    assert_equal 2, @clube.ciclos.find_by!(mes: 2, ano: 2026).slots.count
  end

  private

  def race(&operation)
    ready = Queue.new
    start = Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          start.pop
          begin
            operation.call
          rescue StandardError => error
            error
          end
        end
      end
    end
    2.times { ready.pop }
    2.times { start << true }
    threads.map(&:value)
  end
end
