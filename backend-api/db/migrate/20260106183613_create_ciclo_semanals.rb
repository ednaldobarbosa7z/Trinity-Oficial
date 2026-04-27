class CreateCicloSemanals < ActiveRecord::Migration[8.0]
  def change
    create_table :ciclo_semanals do |t|
      t.integer :numero_semana
      t.date :data_inicio_semana
      t.date :data_fim_semana
      t.text :nome_tema_semana
      t.references :filme, null: false, foreign_key: true
      t.references :clube, null: false, foreign_key: true

      t.timestamps
    end
  end
end
