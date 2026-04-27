class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :nome
      t.string :nickname
      t.string :email
      t.string :password_digest
      t.string :url_foto_perfil
      t.string :pontos_total
      t.date :data_cadastro
      t.boolean :ativo
      t.integer :tipo_enum

      t.timestamps
    end
    add_index :users, :email, unique: true
  end
end
