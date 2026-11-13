class AddDetailsToFilmes < ActiveRecord::Migration[8.0]
  def change
    # Verifica se a coluna existe antes de tentar adicionar
    # Assim evitamos o erro "DuplicateColumn"

    unless column_exists?(:filmes, :titulo)
      add_column :filmes, :titulo, :string
    end

    unless column_exists?(:filmes, :sinopse)
      add_column :filmes, :sinopse, :text
    end

    unless column_exists?(:filmes, :ano_lancamento)
      add_column :filmes, :ano_lancamento, :integer
    end

    unless column_exists?(:filmes, :url_poster)
      add_column :filmes, :url_poster, :string
    end

    unless column_exists?(:filmes, :url_backdrop)
      add_column :filmes, :url_backdrop, :string
    end

    unless column_exists?(:filmes, :url_link_externo)
      add_column :filmes, :url_link_externo, :string
    end

    unless column_exists?(:filmes, :tmdb_id)
      add_column :filmes, :tmdb_id, :string
    end

    # Adiciona a referência de User apenas se não existir
    unless column_exists?(:filmes, :user_id)
      add_reference :filmes, :user, null: true, foreign_key: true
    end
  end
end
