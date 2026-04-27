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

ActiveRecord::Schema[8.0].define(version: 2026_04_23_131316) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "avaliacaos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "filme_id", null: false
    t.bigint "ciclo_id", null: false
    t.float "nota"
    t.text "comentario"
    t.string "destaque"
    t.text "recado_indicacao"
    t.boolean "assistiria_novamente"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ciclo_id"], name: "index_avaliacaos_on_ciclo_id"
    t.index ["filme_id"], name: "index_avaliacaos_on_filme_id"
    t.index ["user_id"], name: "index_avaliacaos_on_user_id"
  end

  create_table "ciclos", force: :cascade do |t|
    t.bigint "clube_id", null: false
    t.integer "mes", null: false
    t.integer "ano", null: false
    t.integer "qtd_slots", default: 0
    t.string "status", default: "ABERTO"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "tema"
    t.index ["clube_id"], name: "index_ciclos_on_clube_id"
  end

  create_table "clubes", force: :cascade do |t|
    t.string "nome"
    t.string "codigo_acesso"
    t.text "descricao"
    t.date "data_criacao"
    t.string "foto_clube"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "discord_webhook_url"
  end

  create_table "curtida_avaliacaos", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "avaliacao_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["avaliacao_id"], name: "index_curtida_avaliacaos_on_avaliacao_id"
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
    t.index ["clube_id"], name: "index_filmes_on_clube_id"
    t.index ["user_id"], name: "index_filmes_on_user_id"
  end

  create_table "membro_clubes", force: :cascade do |t|
    t.bigint "clube_id", null: false
    t.bigint "user_id", null: false
    t.date "data_entrada"
    t.boolean "eh_administrador"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["clube_id"], name: "index_membro_clubes_on_clube_id"
    t.index ["user_id"], name: "index_membro_clubes_on_user_id"
  end

  create_table "reuniaos", force: :cascade do |t|
    t.string "titulo"
    t.datetime "data_hora"
    t.string "tipo"
    t.string "link_ou_local"
    t.bigint "ciclo_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ciclo_id"], name: "index_reuniaos_on_ciclo_id"
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
    t.bigint "user_id", null: false
    t.bigint "filme_id"
    t.integer "posicao"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ciclo_id"], name: "index_slots_on_ciclo_id"
    t.index ["filme_id"], name: "index_slots_on_filme_id"
    t.index ["user_id"], name: "index_slots_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "nome"
    t.string "nickname"
    t.string "email"
    t.string "password_digest"
    t.string "url_foto_perfil"
    t.string "pontos_total"
    t.date "data_cadastro"
    t.boolean "ativo"
    t.integer "tipo_enum"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
  add_foreign_key "reuniaos", "ciclos"
  add_foreign_key "reunioes", "ciclos"
  add_foreign_key "slots", "ciclos"
  add_foreign_key "slots", "filmes"
  add_foreign_key "slots", "users"
end
