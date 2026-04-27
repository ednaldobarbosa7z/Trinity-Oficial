class CreateClubes < ActiveRecord::Migration[8.0]
  def change
    create_table :clubes do |t|
      t.string :nome
      t.string :codigo_acesso
      t.text :descricao
      t.date :data_criacao
      t.string :foto_clube

      t.timestamps
    end
  end
end
