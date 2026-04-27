class CreateReuniaos < ActiveRecord::Migration[8.0]
  def change
    create_table :reuniaos do |t|
      t.string :titulo
      t.datetime :data_hora
      t.string :tipo
      t.string :link_ou_local
      t.references :ciclo, null: false, foreign_key: true

      t.timestamps
    end
  end
end
