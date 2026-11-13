# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_13_170300) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "avaliacaos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "filme_id", null: false
    t.bigint "ciclo_id", null: false
    t.float "nota", null: false
    t.text "comentario"
    t.string "destaque"
    t.text "recado_indicacao"
    t.boolean "assistiria_novamente"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ciclo_id", "created_at"], name: "index_avaliacaos_on_ciclo_id_and_created_at"
    t.index ["ciclo_id"], name: "index_avaliacaos_on_ciclo_id"
    t.index ["filme_id"], name: "index_avaliacaos_on_filme_id"
    t.index ["user_id", "filme_id", "ciclo_id"], name: "index_avaliacaos_on_user_filme_ciclo", unique: true
    t.index ["user_id"], name: "index_avaliacaos_on_user_id"
    t.check_constraint "nota = ANY (ARRAY[0.5::double precision, 1::double precision, 1.5::double precision, 2::double precision, 2.5::double precision, 3::double precision, 3.5::double precision, 4::double precision, 4.5::double precision, 5::double precision])", name: "avaliacaos_valid_nota"
  end

  create_table "ciclos", force: :cascade do |t|
    t.bigint "clube_id", null: false
    t.integer "mes", null: false
    t.integer "ano", null: false
    t.integer "qtd_slots", default: 0, null: false
    t.string "status", default: "ABERTO", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "tema"
    t.index ["clube_id", "ano", "mes"], name: "index_ciclos_on_clube_id_and_ano_and_mes", unique: true
    t.index ["clube_id"], name: "index_ciclos_on_clube_id"
    t.check_constraint "ano >= 1900 AND ano <= 9999", name: "ciclos_valid_ano"
    t.check_constraint "mes >= 1 AND mes <= 12", name: "ciclos_valid_mes"
    t.check_constraint "qtd_slots >= 1 AND qtd_slots <= 100", name: "ciclos_valid_slots"
    t.check_constraint "status::text = ANY (ARRAY['ABERTO'::character varying::text, 'FECHADO'::character varying::text, 'AGUARDANDO'::character varying::text])", name: "ciclos_valid_status"
  end

  create_table "clubes", force: :cascade do |t|
    t.string "nome"
    t.string "codigo_acesso", null: false
    t.text "descricao"
    t.date "data_criacao"
    t.string "foto_clube"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "discord_webhook_url"
    t.index ["codigo_acesso"], name: "index_clubes_on_codigo_acesso", unique: true
  end

  create_table "curtida_avaliacaos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "avaliacao_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["avaliacao_id"], name: "index_curtida_avaliacaos_on_avaliacao_id"
    t.index ["user_id", "avaliacao_id"], name: "index_curtida_avaliacaos_on_user_id_and_avaliacao_id", unique: true
    t.index ["user_id"], name: "index_curtida_avaliacaos_on_user_id"
  end

  create_table "filmes", force: :cascade do |t|
    t.text "titulo"
    t.string "ano_lancamento"
    t.text "sinopse"
    t.text "url_link_externo"
    t.text "url_poster"
    t.date "data_registro"
    t.bigint "user_id", null: false
    t.bigint "clube_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "url_backdrop"
    t.string "tmdb_id"
    t.index ["clube_id", "created_at"], name: "index_filmes_on_clube_id_and_created_at"
    t.index ["clube_id", "tmdb_id"], name: "index_filmes_on_clube_id_and_tmdb_id", unique: true, where: "(tmdb_id IS NOT NULL)"
    t.index ["clube_id"], name: "index_filmes_on_clube_id"
    t.index ["user_id"], name: "index_filmes_on_user_id"
  end

  create_table "membro_clubes", force: :cascade do |t|
    t.bigint "clube_id", null: false
    t.bigint "user_id", null: false
    t.date "data_entrada"
    t.boolean "eh_administrador", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["clube_id"], name: "index_membro_clubes_on_clube_id"
    t.index ["user_id", "clube_id"], name: "index_membro_clubes_on_user_id_and_clube_id", unique: true
    t.index ["user_id"], name: "index_membro_clubes_on_user_id"
  end

  create_table "reuniaos_legacy", force: :cascade do |t|
    t.string "titulo"
    t.datetime "data_hora"
    t.string "tipo"
    t.string "link_ou_local"
    t.bigint "ciclo_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ciclo_id"], name: "index_reuniaos_legacy_on_ciclo_id"
  end

  create_table "reunioes", force: :cascade do |t|
    t.string "titulo"
    t.datetime "data_hora"
    t.string "tipo"
    t.string "link_ou_local"
    t.bigint "ciclo_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ciclo_id"], name: "index_reunioes_on_ciclo_id"
  end

  create_table "slots", force: :cascade do |t|
    t.bigint "ciclo_id", null: false
    t.bigint "user_id"
    t.bigint "filme_id"
    t.integer "posicao", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ciclo_id", "posicao"], name: "index_slots_on_ciclo_id_and_posicao", unique: true
    t.index ["ciclo_id"], name: "index_slots_on_ciclo_id"
    t.index ["filme_id"], name: "index_slots_on_filme_id"
    t.index ["filme_id"], name: "index_slots_on_unique_filme", unique: true, where: "(filme_id IS NOT NULL)"
    t.index ["user_id"], name: "index_slots_on_user_id"
    t.check_constraint "posicao > 0", name: "slots_positive_posicao"
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.string "concurrency_key", null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.text "error"
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "queue_name", null: false
    t.string "class_name", null: false
    t.text "arguments"
    t.integer "priority", default: 0, null: false
    t.string "active_job_id"
    t.datetime "scheduled_at"
    t.datetime "finished_at"
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.string "queue_name", null: false
    t.datetime "created_at", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.bigint "supervisor_id"
    t.integer "pid", null: false
    t.string "hostname"
    t.text "metadata"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "task_key", null: false
    t.datetime "run_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.string "key", null: false
    t.string "schedule", null: false
    t.string "command", limit: 2048
    t.string "class_name"
    t.text "arguments"
    t.string "queue_name"
    t.integer "priority", default: 0
    t.boolean "static", default: true, null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.bigint "job_id", null: false
    t.string "queue_name", null: false
    t.integer "priority", default: 0, null: false
    t.datetime "scheduled_at", null: false
    t.datetime "created_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.string "key", null: false
    t.integer "value", default: 1, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "nome"
    t.string "nickname", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "url_foto_perfil"
    t.string "pontos_total"
    t.date "data_cadastro"
    t.boolean "ativo"
    t.integer "tipo_enum"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "lower((email)::text)", name: "index_users_on_normalized_email", unique: true
    t.index "lower((nickname)::text)", name: "index_users_on_normalized_nickname", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "avaliacaos", "ciclos"
  add_foreign_key "avaliacaos", "filmes"
  add_foreign_key "avaliacaos", "users"
  add_foreign_key "ciclos", "clubes"
  add_foreign_key "curtida_avaliacaos", "avaliacaos"
  add_foreign_key "curtida_avaliacaos", "users"
  add_foreign_key "filmes", "clubes"
  add_foreign_key "filmes", "users"
  add_foreign_key "membro_clubes", "clubes"
  add_foreign_key "membro_clubes", "users"
  add_foreign_key "reunioes", "ciclos"
  add_foreign_key "slots", "ciclos"
  add_foreign_key "slots", "filmes"
  add_foreign_key "slots", "users"
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
end
