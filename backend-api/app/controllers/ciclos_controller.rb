class CiclosController < ApplicationController
  before_action :authorize_request

  # POST /clubes/:id/ciclos_mensal
  # Esta ação cria a estrutura do mês: define o Ciclo e sorteia os Slots entre os membros.
# POST /clubes/:id/ciclos_mensal
  # Esta ação cria a estrutura do mês: define o Ciclo e sorteia os Slots entre os membros.
  def create_mensal
    # O Angular envia /clubes/1/..., portanto o ID do clube vem no params[:id]
    clube = Clube.find(params[:id])
    
    # Normalização de parâmetros para aceitar diferentes formatos vindos do Angular
    ciclo_params_data = params[:ciclo] || params
    mes = ciclo_params_data[:mes]
    ano = ciclo_params_data[:ano]
    qtd_slots = ciclo_params_data[:qtd_slots].to_i
    tema = ciclo_params_data[:tema] # <-- ADICIONADO AQUI: Captura o tema do frontend

    # 1. VALIDAÇÃO: Impede a criação de um ciclo vazio
    if qtd_slots < 1
      return render json: { error: "O ciclo precisa ter pelo menos 1 vaga (slot)." }, status: :unprocessable_entity
    end

    # 2. UNICIDADE: Garante que não existam dois ciclos para o mesmo mês/ano no clube
    if Ciclo.exists?(clube: clube, mes: mes, ano: ano)
      return render json: { error: "Já existe um ciclo configurado para #{mes}/#{ano}." }, status: :conflict
    end

    # 3. TRANSAÇÃO: Ciclo e Slots são criados como uma unidade (se um falhar, nada é salvo)
    ActiveRecord::Base.transaction do
      @ciclo = Ciclo.create!(
        clube: clube,
        mes: mes,
        ano: ano,
        qtd_slots: qtd_slots,
        status: 'ABERTO',
        tema: tema # <-- ADICIONADO AQUI: Salva o tema no banco
      )

      # --- LÓGICA DE DISTRIBUIÇÃO DE SLOTS (O SORTEIO) ---
      membros = clube.users.to_a
      total_membros = membros.count
      pool_sorteio = []

      if total_membros > 0
        # Distribuição igualitária: cada membro recebe X slots
        slots_por_pessoa = qtd_slots / total_membros
        slots_por_pessoa.times { membros.each { |membro| pool_sorteio << membro } }
        
        # Distribuição das sobras: se sobrarem slots, entrega aleatoriamente
        sobra = qtd_slots % total_membros
        if sobra > 0
          pool_sorteio.concat(membros.shuffle.take(sobra))
        end
        
        # Embaralha a ordem final para ninguém saber quem indica em qual semana
        pool_sorteio.shuffle!
      else
        # Fallback caso o clube ainda não tenha membros / rever aqui para caso o clube só tenha 1 membro
        pool_sorteio = Array.new(qtd_slots, nil)
      end

      # Criação física dos Slots no banco de dados
      pool_sorteio.each_with_index do |user, index|
        Slot.create!(
          ciclo: @ciclo, 
          posicao: index + 1, 
          user: user, 
          filme: nil
        )
      end

      # Notificação automática no Discord
      DiscordNotifier.enviar(
        clube, 
        "Um novo mês de filmes começou! O tabuleiro tem #{qtd_slots} vagas. Corram para garantir as suas indicações.", 
        "Novo Ciclo Aberto: #{mes}/#{ano}"
      )

      # Retorna o ciclo com os slots e usuários incluídos para o Angular atualizar a tela
      render json: @ciclo, include: { slots: { include: :user } }, status: :created
    end

  rescue ActiveRecord::RecordNotFound => e
    render json: { error: "Clube não encontrado: #{e.message}" }, status: :not_found
  rescue => e
    # Em caso de erro, loga no Docker e avisa o front
    Rails.logger.error "ERRO CRÍTICO NO CREATE_MENSAL: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    render json: { error: "Falha ao criar ciclo: #{e.message}" }, status: :unprocessable_entity
  end

  # POST /clubes/:id/salvar_filme/:slot_id
  # Ação onde o usuário preenche a vaga dele com um filme do TMDB
  def salvar_filme
    slot = Slot.find(params[:slot_id])
    clube = Clube.find(params[:id])
    
    # SEGURANÇA: Apenas o dono do slot pode preenchê-lo
    unless slot.user_id == @current_user.id
      return render json: { error: "Sem permissão para indicar neste slot." }, status: :forbidden
    end

    # 🛑 MURALHA ANTI-REPETIÇÃO 🛑
    # Impede que o clube assista o mesmo filme duas vezes no catálogo histórico
    filme_existente = Filme.find_by(tmdb_id: params[:tmdb_id], clube_id: clube.id)
    
    # Se o filme já existir E estiver em algum outro slot do clube (where.not protege o próprio slot do usuário)
    if filme_existente && Slot.where(filme_id: filme_existente.id).where.not(id: slot.id).exists?
      return render json: { 
        error: "🚫 Alto lá! O clube já assistiu '#{filme_existente.titulo}' em outra ocasião. Escolha outro!" 
      }, status: :unprocessable_entity
    end
    
    # Se o filme já existe no banco (indicado por outro), reaproveita o registro. Se não, cria um novo.
    filme = filme_existente || Filme.new(tmdb_id: params[:tmdb_id], clube_id: clube.id)
    
    filme.assign_attributes(filme_params)
    filme.clube_id = clube.id
    filme.user_id = slot.user_id 

    if filme.save
      if slot.update(filme: filme)
        
        # Notifica no Discord a nova indicação
        begin
          if clube.discord_webhook_url.present?
            DiscordNotifier.enviar(
              clube, 
              "#{@current_user.nickname} acabou de indicar **#{filme.titulo}** para este mês! 🍿", 
              "Nova Indicação na Mesa",
              "3447003"
            )
          end
        rescue => e
          Rails.logger.error "Aviso: Falha ao notificar Discord (Indicação): #{e.message}"
        end

        render json: slot, include: [:filme, :user]
      else
        render json: { error: slot.errors.full_messages }, status: :unprocessable_entity
      end
    else
      # Fallback de segurança original do seu código
      if filme.errors[:tmdb_id].any?
        if slot.update(filme: filme_existente)

          # GATILHO DISCORD: FILME REPETIDO (Porém aceito no mesmo slot) INDICADO
          begin
            if clube.discord_webhook_url.present?
              DiscordNotifier.enviar(
                clube, 
                "#{@current_user.nickname} acabou de indicar **#{filme_existente.titulo}** para este mês! 🍿", 
                "Nova Indicação na Mesa",
                "3447003"
              )
            end
          rescue => e
            Rails.logger.error "Aviso: Falha ao notificar Discord (Indicação Existente): #{e.message}"
          end

          return render json: slot, include: [:filme, :user]
        end
      end
      render json: { error: filme.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /clubes/:id/ciclos/:ciclo_id
  # Função administrativa para limpar um ciclo inteiro (e seus slots/avaliações via cascade)
  def destroy
    clube = Clube.find(params[:id])
    
    # SEGURANÇA: Somente administradores do clube podem deletar ciclos
    membro = MembroClube.find_by(user: @current_user, clube: clube)
    return render json: { error: 'Acesso negado' }, status: :forbidden unless membro&.eh_administrador?

    ciclo = Ciclo.find_by(id: params[:ciclo_id], clube_id: clube.id)

    if ciclo
      ciclo.destroy!
      render json: { message: "Ciclo e todos os seus dados foram limpos com sucesso!" }, status: :ok
    else
      render json: { error: "Ciclo não encontrado." }, status: :not_found
    end
  rescue => e
    Rails.logger.error "🚨 ERRO AO DELETAR CICLO: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    render json: { error: "Erro interno: #{e.message}" }, status: :unprocessable_entity
  end

  private

  def filme_params
    params.permit(:titulo, :sinopse, :ano_lancamento, :url_poster, :url_backdrop, :tmdb_id, :url_link_externo)
  end
end