class JsonWebToken
  # --- A CHAVE MESTRA ---
  # Define a chave secreta usada para assinar e validar os tokens.
  # Ela tenta ler dos 'credentials' (seguro para produção) ou do 'secret_key_base'.
  # Se alguém descobrir essa chave, poderá gerar tokens falsos para qualquer usuário.
  SECRET_KEY = Rails.application.credentials.secret_key_base || Rails.application.secret_key_base

  # --- MÉTODO DE CODIFICAÇÃO (Cria o Token) ---
  # Recebe os dados (payload) e define um tempo de expiração (padrão 24 horas).
  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    # Gera a string criptografada usando o algoritmo padrão do JWT e a nossa SECRET_KEY.
    JWT.encode(payload, SECRET_KEY)
  end

  # --- MÉTODO DE DECODIFICAÇÃO (Lê o Token) ---
  # Recebe a string criptografada e tenta transformá-la de volta em dados.
  def self.decode(token)
    # O método 'JWT.decode' retorna um array; o [0] pega a primeira parte (o payload).
    decoded = JWT.decode(token, SECRET_KEY)[0]

    # Converte o hash para 'IndifferentAccess', permitindo acessar os dados 
    # tanto por string canto por símbolo (ex: decoded[:user_id] ou decoded['user_id']).
    HashWithIndifferentAccess.new decoded
  rescue
    # Se o token estiver expirado, corrompido ou for falso, o Rails entra no rescue.
    # Retornamos nil para que o ApplicationController saiba que o acesso foi negado.
    nil
  end
end