class UsersController < ApplicationController
  skip_before_action :authorize_request, only: :create
  rate_limit to: 5, within: 1.hour, only: :create,
    with: -> { render_error("Muitos cadastros. Tente mais tarde.", :too_many_requests) }

  def create
    user = User.create!(user_params)
    render json: { token: JsonWebToken.encode(user_id: user.id),
      user: UserPresenter.new(user, private_profile: true).as_json.merge(has_club: false) }, status: :created
  end

  def perfil
    render json: UserProfile.new(user: @current_user, viewer: @current_user,
      clube: @current_user.clubes.order(:id).first, page: params.fetch(:page, 1),
      per_page: params.fetch(:per_page, 50))
  end

  def perfil_publico
    alvo = User.find(params[:id])
    clube = @current_user.clubes.where(id: alvo.clubes.select(:id)).order(:id).first
    raise ApiError.new("Vocês não são do mesmo clube.", status: :forbidden) unless clube
    render json: UserProfile.new(user: alvo, viewer: @current_user, clube: clube,
      page: params.fetch(:page, 1), per_page: params.fetch(:per_page, 50))
  end

  def update_perfil
    @current_user.update!(user_params)
    render json: { message: "Perfil atualizado com sucesso!",
      user: UserPresenter.new(@current_user, private_profile: true).as_json }
  end

  private

  def user_params
    params.require(:user).permit(:nome, :nickname, :email, :password, :password_confirmation, :url_foto_perfil)
  end
end
