class AddTemaToCiclos < ActiveRecord::Migration[8.0]
  def change
    add_column :ciclos, :tema, :string
  end
end
