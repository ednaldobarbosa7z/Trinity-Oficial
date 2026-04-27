class ApplicationController < ActionController::API
  
  # --- MÉTODO DE AUTENTICAÇÃO GLOBAL ---
  # Este método é o responsável por verificar se quem está chamando a API é quem diz ser.
  # Geralmente é chamado via 'before_action' nos outros controllers.
  def authorize_request
    # 1. Busca o campo 'Authorization' no cabeçalho (Header) da requisição HTTP.
    header = request.headers['Authorization']

    # 2. O padrão do token é "Bearer <token>". 
    # O .split(' ').last remove a palavra "Bearer" e pega apenas a string do token.
    header = header.split(' ').last if header
    
    begin
      # 3. Usa a sua classe utilitária JsonWebToken para tentar traduzir o token.
      # Se o token estiver expirado ou alterado, ele lançará um erro aqui.
      @decoded = JsonWebToken.decode(header)

      # 4. Se a decodificação funcionar, buscamos o usuário no banco pelo ID que estava no token.
      # O uso de @current_user (variável de instância) torna o usuário disponível 
      # para todos os controllers que herdam desta classe.
      @current_user = User.find(@decoded[:user_id])
    rescue ActiveRecord::RecordNotFound, JWT::DecodeError

      # 5. TRATAMENTO DE ERRO:
      # Se o ID do usuário não existir ou o token for inválido/expirado,
      # a API interrompe a execução e retorna "401 Unauthorized" imediatamente.
      render json: { errors: 'Acesso não autorizado' }, status: :unauthorized
    end
  end
end