class ResetEstruturaCiclos < ActiveRecord::Migration[7.1]
  def change
    # 1. REMOVER ESTRUTURA ANTIGA
    # Se a tabela existe, vamos derrubar para criar do zero
    drop_table :ciclos, if_exists: true

    # Removemos referências antigas da tabela de filmes
    remove_column :filmes, :eh_filme_da_semana, :boolean, if_exists: true
    remove_reference :filmes, :ciclo, index: true, if_exists: true


    # 2. CRIAR NOVA ESTRUTURA (PADRÃO MENSAL)

    # Tabela de Ciclos (Mensal)
    create_table :ciclos do |t|
      t.references :clube, null: false, foreign_key: true
      t.integer :mes, null: false       # 1 a 12
      t.integer :ano, null: false       # 2026
      t.integer :qtd_slots, default: 0  # Quantos filmes teremos neste mês
      t.string :status, default: 'ABERTO' # ABERTO, FECHADO, AGUARDANDO

      t.timestamps
    end

    # Tabela de Slots (As Vagas para Filmes)
    create_table :slots do |t|
      t.references :ciclo, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true # O Dono da indicação (Sorteado)
      t.references :filme, foreign_key: true, null: true # O Filme escolhido (começa vazio)
      
      t.integer :posicao # 1, 2, 3, 4 (Ordem de exibição)
      
      t.timestamps
    end
  end
end