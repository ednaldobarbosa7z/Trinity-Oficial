class ReunioesController < ApplicationController
  before_action :authorize_request

  # POST /ciclos/:ciclo_id/reunioes
  def create
    ciclo = Ciclo.find(params[:ciclo_id])
    
    # Segurança: Apenas administradores do clube podem agendar reuniões
    membro = MembroClube.find_by(user: @current_user, clube: ciclo.clube)
    return render json: { error: 'Acesso negado. Apenas admins podem agendar.' }, status: :forbidden unless membro&.eh_administrador

    reuniao = ciclo.reunioes.new(reuniao_params)

    if reuniao.save
      render json: { message: 'Reunião agendada com sucesso!', reuniao: reuniao }, status: :created
    else
      render json: { errors: reuniao.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /ciclos/:ciclo_id/reunioes/:id
  def destroy
    ciclo = Ciclo.find(params[:ciclo_id])
    
    # Segurança: Apenas admins do clube podem deletar
    membro = MembroClube.find_by(user: @current_user, clube: ciclo.clube)
    return render json: { error: 'Acesso negado' }, status: :forbidden unless membro&.eh_administrador

    reuniao = ciclo.reunioes.find(params[:id])

    if reuniao.destroy
      render json: { message: 'Reunião removida!' }, status: :ok
    else
      render json: { error: 'Falha ao remover reunião' }, status: :unprocessable_entity
    end
  end

  private

  def reuniao_params
    params.require(:reuniao).permit(:titulo, :data_hora, :tipo, :link_ou_local)
  end
end