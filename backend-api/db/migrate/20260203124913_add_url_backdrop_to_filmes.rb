class AddUrlBackdropToFilmes < ActiveRecord::Migration[8.0]
  def change
    add_column :filmes, :url_backdrop, :string
  end
end
