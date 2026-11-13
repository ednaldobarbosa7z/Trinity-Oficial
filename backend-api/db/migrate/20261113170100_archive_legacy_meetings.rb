class ArchiveLegacyMeetings < ActiveRecord::Migration[8.1]
  def up
    return unless table_exists?(:reuniaos)

    # Preserve legacy records, copying only meetings not already in the canonical table.
    execute <<~SQL
      INSERT INTO reunioes (titulo, data_hora, tipo, link_ou_local, ciclo_id, created_at, updated_at)
      SELECT old.titulo, old.data_hora, old.tipo, old.link_ou_local, old.ciclo_id, old.created_at, old.updated_at
      FROM reuniaos old
      WHERE NOT EXISTS (
        SELECT 1 FROM reunioes current_meeting
        WHERE current_meeting.titulo IS NOT DISTINCT FROM old.titulo
          AND current_meeting.data_hora IS NOT DISTINCT FROM old.data_hora
          AND current_meeting.tipo IS NOT DISTINCT FROM old.tipo
          AND current_meeting.link_ou_local IS NOT DISTINCT FROM old.link_ou_local
          AND current_meeting.ciclo_id = old.ciclo_id
      )
    SQL
    remove_foreign_key :reuniaos, :ciclos if foreign_key_exists?(:reuniaos, :ciclos)
    rename_table :reuniaos, :reuniaos_legacy
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Legacy meetings are preserved in reuniaos_legacy."
  end
end
