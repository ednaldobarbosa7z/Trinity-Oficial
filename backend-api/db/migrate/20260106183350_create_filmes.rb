class CreateFilmes < ActiveRecord::Migration[8.0]
  def change
    create_table :filmes do |t|
      t.text :titulo
      t.string :ano_lancamento
      t.text :sinopse
      t.text :url_link_externo
      t.text :url_poster
      t.date :data_registro
      t.references :user, null: false, foreign_key: true
      t.references :clube, null: false, foreign_key: true

      t.timestamps
    end
  end
end
