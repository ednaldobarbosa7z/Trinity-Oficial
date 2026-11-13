class JsonWebToken
  ALGORITHM = "HS256"

  def self.encode(payload, exp = 24.hours.from_now)
    JWT.encode(payload.merge(exp: exp.to_i), secret, ALGORITHM)
  end

  def self.decode(token)
    payload = JWT.decode(token, secret, true, algorithms: [ ALGORITHM ],
      required_claims: [ "exp", "user_id" ])[0]
    raise JWT::DecodeError unless payload["user_id"].is_a?(Integer) && payload["user_id"].positive?
    payload
  end

  def self.secret
    Rails.application.secret_key_base
  end
  private_class_method :secret
end
