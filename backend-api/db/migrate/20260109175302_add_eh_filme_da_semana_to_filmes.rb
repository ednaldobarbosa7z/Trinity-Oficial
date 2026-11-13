class AddEhFilmeDaSemanaToFilmes < ActiveRecord::Migration[8.0]
  def change
    add_column :filmes, :eh_filme_da_semana, :boolean, default: false
  end
end
