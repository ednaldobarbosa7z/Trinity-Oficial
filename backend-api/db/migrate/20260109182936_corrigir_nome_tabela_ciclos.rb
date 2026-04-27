class CorrigirNomeTabelaCiclos < ActiveRecord::Migration[8.0]
  def change
    rename_table :ciclo_semanals, :ciclo_semanais
  end
end