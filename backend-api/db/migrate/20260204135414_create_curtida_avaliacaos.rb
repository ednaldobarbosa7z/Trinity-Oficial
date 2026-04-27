class CreateCurtidaAvaliacaos < ActiveRecord::Migration[8.0]
  def change
    create_table :curtida_avaliacaos do |t|
      t.references :user, null: false, foreign_key: true
      t.references :avaliacao, null: false, foreign_key: true

      t.timestamps
    end
  end
end
