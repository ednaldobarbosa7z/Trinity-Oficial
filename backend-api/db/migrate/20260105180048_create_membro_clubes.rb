class CreateMembroClubes < ActiveRecord::Migration[8.0]
  def change
    create_table :membro_clubes do |t|
      t.references :clube, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.date :data_entrada
      t.boolean :eh_administrador

      t.timestamps
    end
  end
end
