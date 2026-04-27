class DropCicloSemanais < ActiveRecord::Migration[8.0]
  def change
    # Verifica se a tabela existe antes de tentar apagar (evita erros)
    if table_exists?(:ciclo_semanais)
      drop_table :ciclo_semanais
    end
  end
end