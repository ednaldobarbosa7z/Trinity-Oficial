class CurtidasAvaliacoesController < ApplicationController
  def toggle_like
    avaliacao = Avaliacao.where(filme_id: accessible_filmes.select(:id)).find(params[:id])
    avaliacao.with_lock do
      curtida = avaliacao.curtidas.find_by(user: @current_user)
      liked = curtida.nil?
      liked ? avaliacao.curtidas.create!(user: @current_user) : curtida.destroy!
      render json: { message: liked ? "Curtiu" : "Descurtiu", curtido: liked, count: avaliacao.curtidas.count }
    end
  end
end
