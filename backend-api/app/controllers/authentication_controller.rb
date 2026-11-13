class AuthenticationController < ApplicationController
  skip_before_action :authorize_request, only: :login
  rate_limit to: 10, within: 3.minutes, only: :login,
    with: -> { render_error("Muitas tentativas. Aguarde alguns minutos.", :too_many_requests) }

  def login
    user = User.find_by(email: params[:email].to_s.strip.downcase)
    if user&.authenticate(params[:password].to_s)
      render json: {
        token: JsonWebToken.encode(user_id: user.id),
        user: UserPresenter.new(user, private_profile: true).as_json.merge(has_club: user.clubes.exists?)
      }
    else
      render_error("Email ou senha inválidos.", :unauthorized)
    end
  end
end
