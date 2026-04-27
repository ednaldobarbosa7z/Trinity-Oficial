class AuthenticationController < ApplicationController
  # POST /auth/login
  # Rota principal para autenticação. Recebe email e senha e devolve o token de acesso.
  def login

    # Busca o usuário pelo email fornecido nos parâmetros
    @user = User.find_by_email(params[:email])

    # 1. VERIFICAÇÃO DE CREDENCIAIS
    # O método 'authenticate' é fornecido pelo 'has_secure_password' no Model User.
    # Ele compara o hash da senha enviada com o que está salvo no banco.
    # O '&.' (safe navigation) evita erro se o @user for nil.
    if @user&.authenticate(params[:password])
      
      # 2. GERAÇÃO DO TOKEN
      # Se a senha estiver correta, criamos um token JWT contendo o ID do usuário.
      token = JsonWebToken.encode(user_id: @user.id)
      
      # 3. VERIFICAÇÃO DE FLUXO (UX)
      # Verifica se o usuário já faz parte de algum clube.
      # Isso é vital para o Frontend saber se redireciona para "Criar Clube" ou para a "Home".
      tem_clube = @user.clubes.any? 

      # 4. RESPOSTA DE SUCESSO
      # Retorna o token e os dados básicos para o Angular salvar no LocalStorage.
      render json: { 
        token: token,
        user: {
          id: @user.id,
          nome: @user.nome,
          nickname: @user.nickname,
          email: @user.email,
          has_club: tem_clube # <--- Flag fundamental para o roteamento no Angular
        }
      }, status: :ok
    else
      # 5. RESPOSTA DE ERRO
      # Retorna 401 Unauthorized para o Frontend mostrar o alerta de erro.
      render json: { error: 'Email ou senha inválidos' }, status: :unauthorized
    end
  end
end