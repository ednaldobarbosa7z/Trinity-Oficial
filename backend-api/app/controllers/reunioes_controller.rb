class ReunioesController < ApplicationController
  def create
    ciclo = accessible_ciclos.find(params[:ciclo_id])
    admin_clube(ciclo.clube_id)
    reuniao = nil
    ciclo.with_lock { reuniao = ciclo.reunioes.create!(reuniao_params) }
    render json: { message: "Reunião agendada com sucesso!", reuniao: reuniao }, status: :created
  end

  def destroy
    ciclo = accessible_ciclos.find(params[:ciclo_id])
    admin_clube(ciclo.clube_id)
    ciclo.with_lock { ciclo.reunioes.find(params[:id]).destroy! }
    render json: { message: "Reunião removida!" }
  end

  private

  def reuniao_params
    params.require(:reuniao).permit(:titulo, :data_hora, :tipo, :link_ou_local)
  end
end
