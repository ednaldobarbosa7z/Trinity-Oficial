class CiclosController < ApplicationController
  def create_mensal
    clube = admin_clube(params[:id])
    attributes = (params[:ciclo] || params).permit(:mes, :ano, :qtd_slots, :tema).to_h.symbolize_keys
    ciclo = MonthlyCycleCreator.call(clube: clube, attributes: attributes)
    render json: ciclo, include: { slots: { include: :user } }, status: :created
  end

  def salvar_filme
    slot = FilmIndication.call(clube: member_clube(params[:id]), slot_id: params[:slot_id],
      actor: @current_user, attributes: filme_params.to_h.symbolize_keys)
    render json: slot, include: [ :filme, :user ]
  end

  def destroy
    clube = admin_clube(params[:id])
    clube.with_lock { clube.ciclos.find(params[:ciclo_id]).destroy! }
    render json: { message: "Ciclo e seus dados foram removidos com sucesso!" }
  end

  private

  def filme_params
    source = params[:filme] || params
    source.permit(:titulo, :sinopse, :ano_lancamento, :url_poster, :url_backdrop,
      :tmdb_id, :url_link_externo)
  end
end
