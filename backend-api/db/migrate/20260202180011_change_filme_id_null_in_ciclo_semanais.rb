class ChangeFilmeIdNullInCicloSemanais < ActiveRecord::Migration[7.1] # ou sua versão
  def change
    # Sintaxe: change_column_null :tabela, :coluna, true (true = permite nulo)
    change_column_null :ciclo_semanais, :filme_id, true
  end
end