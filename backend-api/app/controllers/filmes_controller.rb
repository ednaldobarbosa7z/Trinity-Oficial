class FilmesController < ApplicationController

  # --- FILTROS ---
  # Garante que o usuário esteja logado.
  before_action :authorize_request

  # Garante que as ações aconteçam dentro do contexto de um clube específico.
  before_action :set_clube

  # GET /clubes/:clube_id/filmes
  # Lista o catálogo de filmes que já foram integrados a algum ciclo de sorteio.
  def index
    
    # Uso do .includes(:slot) para evitar múltiplas consultas ao banco (problema N+1).
    @filmes = @clube.filmes.includes(:slot).order(created_at: :desc)
    render json: @filmes
  end

  # POST /clubes/:clube_id/filmes
  # Ação de "Indicar um Filme". Vincula um filme do TMDB a uma vaga (Slot) específica.
  def create

    # O ID do slot é crucial, pois no seu sistema um filme "nasce" dentro de uma vaga de ciclo.
    slot_id = params[:slot_id]
    
    if slot_id.blank?
      return render json: { error: "Slot não informado." }, status: :unprocessable_entity
    end

    # 1. BUSCA O SLOT E VERIFICA REGRAS DE SEGURANÇA
    # O 'ciclo: @clube.ciclos' garante que ninguém tente injetar um filme em um slot de OUTRO clube.
    slot = Slot.find_by(id: slot_id, ciclo: @clube.ciclos) # Garante que slot é deste clube
    
    unless slot
      return render json: { error: "Slot não encontrado." }, status: :not_found
    end

    # REGRA DE OURO: Valida se o usuário logado é realmente o dono daquela vaga no sorteio.
    unless slot.user_id == @current_user.id 
      return render json: { error: "Você não tem permissão para indicar nesta vaga." }, status: :forbidden
    end

    # Verifica se o slot já não tem um filme para evitar sobrescrita acidental.
    if slot.filme_id.present?
      return render json: { error: "Esta vaga já foi preenchida." }, status: :unprocessable_entity
    end

    # 2. SALVA O FILME
    # Instancia o filme com os dados vindos da API externa (TMDB).
    @filme = Filme.new(filme_params)
    @filme.clube = @clube
    @filme.user = @current_user

    if @filme.save
      # 3. VINCULA O FILME AO SLOT (Conclusão do ciclo)
      # O update! com exclamação lança uma exceção se algo der errado na atualização.
      slot.update!(filme: @filme)

      render json: @filme, status: :created
    else
      # Erro de validação (ex: filme duplicado no mesmo clube).
      render json: { errors: @filme.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private
  # Método para buscar o clube baseado no ID passado na URL.
  def set_clube
    @clube = Clube.find(params[:clube_id])
  end

  # Define quais campos do filme o Rails permite gravar.
  # Note que você está aceitando dados ricos (backdrop, diretor, generos).
  def filme_params
    
    params.require(:filme).permit(
      :titulo, :sinopse, :ano_lancamento, :duracao_minutos,
      :diretor, :generos, :url_poster, :url_backdrop,
      :tmdb_id, :url_link_externo
    )
  end
end