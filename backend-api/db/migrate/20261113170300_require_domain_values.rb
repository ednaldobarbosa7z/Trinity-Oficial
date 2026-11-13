class RequireDomainValues < ActiveRecord::Migration[8.1]
  def change
    change_column_null :ciclos, :qtd_slots, false
    change_column_null :ciclos, :status, false
    change_column_null :avaliacaos, :nota, false
    change_column_null :users, :password_digest, false
  end
end
