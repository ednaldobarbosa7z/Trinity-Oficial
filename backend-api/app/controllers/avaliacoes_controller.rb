class AvaliacoesController < ApplicationController

  # --- SEGURANÇA ---
  # Apenas usuários autenticados podem postar ou visualizar resenhas detalhadas.
  before_action :authorize_request

  # POST /avaliacoes
  # Ação de salvar uma nova resenha/crítica no banco de dados.
  def create
    # Instancia a avaliação com os parâmetros permitidos (Strong Params)
    avaliacao = Avaliacao.new(avaliacao_params)

    # Vincula automaticamente ao usuário que está logado (extraído do token JWT)
    avaliacao.user = @current_user

    if avaliacao.save
      # --- GATILHO DISCORD: NOTIFICAÇÃO DE NOVA CRÍTICA ---
      # Usamos um bloco begin/rescue para que, se o Discord estiver fora do ar,
      # a avaliação do usuário no site NÃO seja cancelada.
      begin
        # Tenta identificar o clube para saber para qual servidor enviar a fofoca
        clube = avaliacao.ciclo&.clube || @current_user.clubes.first
        
        # Só dispara se o clube tiver a URL configurada
        if clube && clube.discord_webhook_url.present?
          # LÓGICA DAS ESTRELINHAS: Transforma a nota (ex: 4.5) em visual (⭐⭐⭐⭐½)
          nota_inteira = avaliacao.nota.to_i
          meia_estrela = (avaliacao.nota % 1 != 0) ? "½" : ""
          estrelinhas = ("⭐" * nota_inteira) + meia_estrela

          # Montagem da mensagem criativa para o Discord
          mensagem = "**#{@current_user.nickname}** assistiu e avaliou **#{avaliacao.filme.titulo}**!\n\n"
          mensagem += "🎟️ **Nota:** #{estrelinhas} (#{avaliacao.nota})\n"          
          mensagem += "\nCorram para o site para ler a crítica completa e deixar aquele like!"

          # Dispara a notificação via Webhook
          DiscordNotifier.enviar(
            clube, 
            mensagem, 
            "Nova Crítica no Ar! ✍️", 
            "16766720" # Cor Amarelo Ouro
          )
        end
      rescue => e
        # Apenas loga o erro no servidor, sem interromper o fluxo do usuário
        Rails.logger.error "Aviso: Falha ao notificar o Discord sobre a avaliação: #{e.message}"
      end
      # =================================================================

      render json: avaliacao, status: :created
    else
      render json: { error: avaliacao.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /avaliacoes/filme/:filme_id
  # Lista todas as resenhas de um filme específico para exibir no mural.
  def index_por_filme
    avaliacoes = Avaliacao.where(filme_id: params[:filme_id])
                          .includes(:user, :curtidas)
                          .order(created_at: :desc)
    
    # Formata o JSON para o Angular já saber se o usuário atual curtiu ou não cada postagem
    lista_formatada = avaliacoes.map do |av|
      {
        id: av.id,
        nota: av.nota,
        comentario: av.comentario,
        destaque: av.destaque,
        recado_indicacao: av.recado_indicacao,
        assistiria_novamente: av.assistiria_novamente,
        created_at: av.created_at,
        user: {
          id: av.user.id,
          nickname: av.user.nickname,
          url_foto_perfil: av.user.url_foto_perfil
        },
        curtidas_count: av.curtidas.count,
        # 'curtido_por_mim' permite ao Front-end pintar o ícone de coração de vermelho/preenchido
        curtido_por_mim: av.curtidas.exists?(user: @current_user) # Importante pro Front pintar o coração
      }
    end

    render json: lista_formatada
  end

  private

  # Define quais campos o Rails aceita receber no JSON de criação
  def avaliacao_params
    params.require(:avaliacao).permit(:filme_id, :ciclo_id, :nota, :comentario, :destaque, :recado_indicacao, :assistiria_novamente)
  end
end