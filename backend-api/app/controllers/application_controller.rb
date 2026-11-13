class ApplicationController < ActionController::API
  before_action :authorize_request

  rescue_from StandardError, with: :internal_error
  rescue_from ActiveRecord::RecordNotFound, with: -> { render_error("Registro não encontrado.", :not_found) }
  rescue_from ActiveRecord::RecordInvalid, with: ->(error) { render_error(error.record.errors.full_messages, :unprocessable_entity) }
  rescue_from ActiveRecord::RecordNotUnique, with: -> { render_error("Registro já existe.", :conflict) }
  rescue_from ActiveRecord::InvalidForeignKey, ActiveRecord::RecordNotDestroyed,
    with: -> { render_error("O registro possui vínculos que impedem esta operação.", :unprocessable_entity) }
  rescue_from ActionController::ParameterMissing, ActionController::BadRequest,
    with: -> { render_error("Parâmetros inválidos ou ausentes.", :bad_request) }
  rescue_from ApiError, with: ->(error) { render_error(error.message, error.status) }

  private

  def authorize_request
    scheme, token, extra = request.authorization.to_s.split
    raise JWT::DecodeError unless scheme == "Bearer" && token.present? && extra.nil?

    payload = JsonWebToken.decode(token)
    @current_user = User.find(payload.fetch("user_id"))
  rescue JWT::DecodeError, KeyError, ActiveRecord::RecordNotFound
    render_error("Acesso não autorizado.", :unauthorized)
  end

  def member_clube(id = nil)
    scope = @current_user.clubes
    id.present? ? scope.find(id) : scope.order(:id).first!
  end

  def admin_clube(id = nil)
    clube = member_clube(id)
    unless clube.membro_clubes.exists?(user: @current_user, eh_administrador: true)
      raise ApiError.new("Apenas administradores podem realizar esta operação.", status: :forbidden)
    end
    clube
  end

  def accessible_filmes
    Filme.where(clube_id: @current_user.clubes.select(:id))
  end

  def accessible_ciclos
    Ciclo.where(clube_id: @current_user.clubes.select(:id))
  end

  def paginate(scope)
    page = [ params.fetch(:page, 1).to_i, 1 ].max
    per_page = params.fetch(:per_page, 50).to_i.clamp(1, 100)
    response.set_header("X-Total-Count", scope.count.to_s)
    response.set_header("X-Page", page.to_s)
    response.set_header("X-Per-Page", per_page.to_s)
    scope.limit(per_page).offset((page - 1) * per_page)
  end

  def render_error(messages, status)
    errors = Array(messages)
    render json: { error: errors.join(", "), errors: errors }, status: status
  end

  def internal_error(error)
    Rails.logger.error("request_id=#{request.request_id} error=#{error.class}")
    render_error("Erro interno. Tente novamente.", :internal_server_error)
  end
end
