class UsersController < ApplicationController
  # --- SEGURANÇA ---
  # O authorize_request (definido no ApplicationController) valida o token JWT.
  # Liberamos apenas o 'create' para que novos usuários possam se cadastrar sem token.
  before_action :authorize_request, except: :create

  # POST /users
  # Rota de cadastro de novos usuários.
  def create
    @user = User.new(user_params)
    if @user.save
      # Ao salvar com sucesso, já gera um token para o usuário logar automaticamente.
      token = JsonWebToken.encode(user_id: @user.id)
      render json: { token: token, user: @user.slice(:id, :nome, :email, :nickname) }, status: :created
    else
      # Retorna os erros de validação (ex: "Email já está em uso").
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /users/perfil
  # Endpoint principal do perfil. Ele consolida informações de diversas tabelas.
  def perfil
    user = @current_user

    # 1. Busca avaliações ordenadas pela data, incluindo os dados do filme (evita N+1 queries).
    avaliacoes = user.avaliacoes.includes(:filme).order(created_at: :desc)

    # 2. Identifica o clube do usuário.
    clube = user.clubes.first 
    
    # 3. Busca os outros membros do clube (os "Amigos") para exibir na rede social.
    membros = clube ? clube.users.select(:id, :nome, :nickname, :url_foto_perfil) : []
    
    # 4. SISTEMA DE RECADOS (CORREIO CINÉFILO)
    # Busca avaliações que outros usuários fizeram em filmes que VOCÊ indicou,
    # contanto que eles tenham deixado um texto no campo 'recado_indicacao'.
    recados_recebidos = Avaliacao.includes(:user, :filme)
                                 .joins(:filme)
                                 .where(filmes: { user_id: @current_user.id })
                                 .where.not(recado_indicacao: [nil, ""])
                                 .where.not(user_id: @current_user.id)
                                 .order(created_at: :desc)
                                 .map do |av|
                                   {
                                     id: av.id,
                                     autor: av.user.nickname,
                                     filme_titulo: av.filme.titulo,
                                     nota: av.nota,
                                     texto: av.recado_indicacao
                                   }
                                 end

    # 5. SISTEMA DE CONQUISTAS (GAMIFICAÇÃO)
    # Lógica para desbloquear insígnias no perfil do usuário.
    filmes_indicados = Filme.where(user_id: @current_user.id).includes(:avaliacoes)
    
    # Lógica do "Curador Polêmico":
    # Ocorre quando um filme indicado por você tem 3+ notas e a variação entre a maior e a menor é >= 2.5.
    curador_polemico_desbloqueado = filmes_indicados.any? do |f|
      notas = f.avaliacoes.map(&:nota)
      notas.size >= 3 && (notas.max - notas.min >= 2.5)
    end

    conquistas = {
      primeiro_play: avaliacoes.count >= 1, # Avaliou ao menos um filme.
      cinefilo_veterano: avaliacoes.count >= 10, # Usuário engajado (10+ avaliações).
      curador_polemico: curador_polemico_desbloqueado
    }
    
    # 6. RESPOSTA JSON
    # Monta o objeto final que o Angular irá consumir para preencher a tela de perfil.
    render json: {
      user: user,
      clube: clube ? { nome: clube.nome, codigo: clube.codigo_acesso } : nil,
      amigos: membros, 
      recados_recebidos: recados_recebidos,
      conquistas: conquistas, # <--- ENVIAMOS AS CONQUISTAS PARA O FRONT
      stats: {
        total_avaliacoes: avaliacoes.count,
        total_filmes_assistidos: avaliacoes.count 
      },
      avaliacoes: avaliacoes.map do |av|
        {
          id: av.id,
          nota: av.nota,
          comentario: av.comentario,
          destaque: av.destaque,
          assistiria_novamente: av.assistiria_novamente,
          created_at: av.created_at,
          filme: {
            titulo: av.filme.titulo,
            poster: av.filme.url_poster,
            ano: av.filme.ano_lancamento
          }
        }
      end
    }
  end

# GET /users/:id/perfil_publico
  def perfil_publico
    alvo = User.find_by(id: params[:id])
    return render json: { error: 'Usuário não encontrado' }, status: :not_found unless alvo

    # REGRA DE SEGURANÇA: Validar se quem pediu (@current_user) e o alvo dividem o mesmo clube
    meu_clube = @current_user.clubes.first
    alvo_clube = alvo.clubes.first

    if meu_clube.nil? || alvo_clube.nil? || meu_clube.id != alvo_clube.id
      return render json: { error: 'Acesso negado. Vocês não são do mesmo clube.' }, status: :forbidden
    end

    # 1. Avaliações do ALVO
    avaliacoes = alvo.avaliacoes.includes(:filme).order(created_at: :desc)
    
    # 2. Recados recebidos pelo ALVO
    recados_recebidos = Avaliacao.includes(:user, :filme)
                                 .joins(:filme)
                                 .where(filmes: { user_id: alvo.id })
                                 .where.not(recado_indicacao: [nil, ""])
                                 .where.not(user_id: alvo.id)
                                 .order(created_at: :desc)
                                 .map { |av| { id: av.id, autor: av.user.nickname, filme_titulo: av.filme.titulo, nota: av.nota, texto: av.recado_indicacao } }

    # 3. Conquistas do ALVO
    filmes_indicados = Filme.where(user_id: alvo.id).includes(:avaliacoes)
    curador_polemico_desbloqueado = filmes_indicados.any? do |f|
      notas = f.avaliacoes.map(&:nota)
      notas.size >= 3 && (notas.max - notas.min >= 2.5)
    end

    conquistas = {
      primeiro_play: avaliacoes.count >= 1,
      cinefilo_veterano: avaliacoes.count >= 10,
      curador_polemico: curador_polemico_desbloqueado
    }

    # 4. Retorna exatamente o mesmo esqueleto do seu perfil original
    render json: {
      user: alvo,
      clube: { nome: alvo_clube.nome, codigo: alvo_clube.codigo_acesso },
      amigos: alvo_clube.users.select(:id, :nome, :nickname, :url_foto_perfil),
      recados_recebidos: recados_recebidos,
      conquistas: conquistas,
      stats: { total_avaliacoes: avaliacoes.count, total_filmes_assistidos: avaliacoes.count },
      avaliacoes: avaliacoes.map do |av|
        {
          id: av.id, nota: av.nota, comentario: av.comentario, destaque: av.destaque, assistiria_novamente: av.assistiria_novamente, created_at: av.created_at,
          filme: { titulo: av.filme.titulo, poster: av.filme.url_poster, ano: av.filme.ano_lancamento }
        }
      end
    }
  end

  # PUT /users/perfil
  # Rota para o usuário atualizar seus próprios dados (nome, foto, etc).
  def update_perfil
    if @current_user.update(user_params)
      render json: { message: 'Perfil atualizado com sucesso!', user: @current_user }
    else
      render json: { error: @current_user.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  private

  # Strong Parameters: Define quais campos são permitidos no envio de dados.
  # Protege contra o envio de campos maliciosos.
  def user_params
    params.require(:user).permit(:nome, :nickname, :email, :password, :password_confirmation, :url_foto_perfil)
  end
end