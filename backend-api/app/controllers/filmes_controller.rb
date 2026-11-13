class FilmesController < ApplicationController
  def index
    render json: paginate(member_clube(params[:clube_id]).filmes.order(created_at: :desc, id: :desc))
  end

  def create
    slot = FilmIndication.call(clube: member_clube(params[:clube_id]), slot_id: params.require(:slot_id),
      actor: @current_user, attributes: params.require(:filme).permit(:titulo, :sinopse,
        :ano_lancamento, :url_poster, :url_backdrop, :tmdb_id, :url_link_externo).to_h.symbolize_keys)
    render json: slot.filme, status: :created
  end
end
