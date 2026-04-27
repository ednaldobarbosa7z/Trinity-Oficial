class CreateAvaliacaos < ActiveRecord::Migration[8.0]
  def change
    create_table :avaliacaos do |t|
      t.references :user, null: false, foreign_key: true
      t.references :filme, null: false, foreign_key: true
      t.references :ciclo, null: false, foreign_key: true
      t.float :nota
      t.text :comentario
      t.string :destaque
      t.text :recado_indicacao
      t.boolean :assistiria_novamente

      t.timestamps
    end
  end
end
