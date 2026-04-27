class CurtidasAvaliacoesController < ApplicationController

  # --- SEGURANÇA ---
  # Garante que apenas usuários logados (com token válido) possam interagir com as curtidas.
  before_action :authorize_request

  # POST /avaliacoes/:id/toggle_like
  # Lógica de alternância: Se o registro existe, ele é removido (unlike). 
  # Se não existe, ele é criado (like).
  def toggle_like
    # 1. Localiza a avaliação que está sendo alvo da interação.
    avaliacao = Avaliacao.find(params[:id])

    # 2. Verifica se o usuário logado (@current_user) já curtiu esta avaliação específica.
    curtida = CurtidaAvaliacao.find_by(user: @current_user, avaliacao: avaliacao)

    if curtida
      # CASO A: O usuário já tinha curtido.
      # Deletamos o registro no banco de dados para "descurtir".
      curtida.destroy

      # Retornamos o novo estado e o contador atualizado para o Angular refletir na UI.
      render json: { message: "Descurtiu", curtido: false, count: avaliacao.curtidas.count }
    else
      # CASO B: O usuário ainda não tinha curtido.
      # Criamos um novo registro de curtida vinculado ao usuário e à avaliação.
      CurtidaAvaliacao.create!(user: @current_user, avaliacao: avaliacao)
      
      # Retornamos o estado positivo e o contador incrementado.
      render json: { message: "Curtiu", curtido: true, count: avaliacao.curtidas.count }
    end
  end
end