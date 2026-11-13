class EnforceDomainIntegrity < ActiveRecord::Migration[8.1]
  def up
    # Fail transactionally on collisions; never silently delete existing records.
    execute "UPDATE users SET email = LOWER(BTRIM(email)), nickname = BTRIM(nickname)"
    execute "UPDATE filmes SET tmdb_id = NULLIF(BTRIM(tmdb_id), '')"
    execute "UPDATE membro_clubes SET eh_administrador = FALSE WHERE eh_administrador IS NULL"

    add_index :users, "LOWER(nickname)", unique: true, name: "index_users_on_normalized_nickname"
    add_index :users, "LOWER(email)", unique: true, name: "index_users_on_normalized_email"
    add_index :clubes, :codigo_acesso, unique: true
    add_index :membro_clubes, [ :user_id, :clube_id ], unique: true
    add_index :ciclos, [ :clube_id, :ano, :mes ], unique: true
    add_index :slots, [ :ciclo_id, :posicao ], unique: true
    add_index :slots, :filme_id, unique: true, where: "filme_id IS NOT NULL", name: "index_slots_on_unique_filme"
    add_index :filmes, [ :clube_id, :tmdb_id ], unique: true, where: "tmdb_id IS NOT NULL"
    add_index :avaliacaos, [ :user_id, :filme_id, :ciclo_id ], unique: true, name: "index_avaliacaos_on_user_filme_ciclo"
    add_index :curtida_avaliacaos, [ :user_id, :avaliacao_id ], unique: true
    add_index :avaliacaos, [ :ciclo_id, :created_at ]
    add_index :filmes, [ :clube_id, :created_at ]

    change_column_null :slots, :user_id, true
    change_column_null :slots, :posicao, false
    change_column_default :membro_clubes, :eh_administrador, from: nil, to: false
    change_column_null :membro_clubes, :eh_administrador, false
    change_column_null :users, :email, false
    change_column_null :users, :nickname, false
    change_column_null :clubes, :codigo_acesso, false

    add_check_constraint :ciclos, "mes BETWEEN 1 AND 12", name: "ciclos_valid_mes"
    add_check_constraint :ciclos, "ano BETWEEN 1900 AND 9999", name: "ciclos_valid_ano"
    add_check_constraint :ciclos, "qtd_slots BETWEEN 1 AND 100", name: "ciclos_valid_slots"
    add_check_constraint :ciclos, "status IN ('ABERTO', 'FECHADO', 'AGUARDANDO')", name: "ciclos_valid_status"
    add_check_constraint :slots, "posicao > 0", name: "slots_positive_posicao"
    add_check_constraint :avaliacaos, "nota IN (0.5,1,1.5,2,2.5,3,3.5,4,4.5,5)", name: "avaliacaos_valid_nota"
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Restore the backup to revert data normalization safely."
  end
end
