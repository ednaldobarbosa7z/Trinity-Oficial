Rails.application.routes.draw do
  # --- ROTAS DE AUTENTICAÇÃO ---
  # Define o endpoint de entrada. O Angular envia as credenciais para cá.
  post '/auth/login', to: 'authentication#login'
  
  # --- ROTAS DE USUÁRIOS ---
  # Rotas personalizadas para o perfil do usuário logado.
  get '/users/perfil', to: 'users#perfil'
  put '/users/perfil', to: 'users#update_perfil'
  get '/users/:id/perfil_publico', to: 'users#perfil_publico'
    # Configuração do Webhook do Discord (atrelada ao usuário admin).
  put '/clubes/discord', to: 'clubes#atualizar_discord'

    # Cria as rotas padrão (POST, GET, PUT) para a entidade User.
  resources :users, only: [:create, :show, :update]
  
  # --- ROTAS DE CLUBES (Nested & Custom) ---
  resources :clubes do
    collection do
      post 'entrar'
      get 'meu_clube'
      get 'catalogo'
    end

  # 'member' define rotas que precisam do ID do clube (ex: /clubes/1/...)
    member do
      # Lista todos os ciclos do clube específico.
      get 'ciclos', to: 'clubes#ciclos_index' 
      # Busca detalhes de um mês/ano específico no tabuleiro.
      get 'ciclo_detalhes/:mes/:ano', to: 'clubes#ciclo_detalhes'

      # Comandos administrativos para o Ciclo e para as Vagas (Slots).
      put 'update_ciclo_admin', to: 'clubes#update_ciclo_admin'
      put 'update_slot_admin', to: 'clubes#update_slot_admin'

      # Lógica de criação de ciclo mensal (Sorteio).
      post 'ciclos/mensal', to: 'ciclos#create_mensal'

      # Rota dinâmica para salvar filme: /clubes/:id/salvar_filme/:slot_id
      post :salvar_filme, path: 'salvar_filme/:slot_id', to: 'ciclos#salvar_filme'
      
      # Ação de "destruição": Limpa o mês inteiro se o admin precisar resetar.
      delete 'ciclos/:ciclo_id', to: 'ciclos#destroy'
    end
  end

   # --- ROTAS DE AVALIAÇÕES & SOCIAL ---
  resources :avaliacoes, only: [:create] do

    # O like é vinculado a uma avaliação específica: /avaliacoes/:id/toggle_like
    member do
      post 'toggle_like', to: 'curtidas_avaliacoes#toggle_like'
    end
  end

  # Busca todas as críticas de um filme para o mural de recados.
  get '/avaliacoes/filme/:filme_id', to: 'avaliacoes#index_por_filme'

  # Rota de monitoramento (padrão do Rails) para saber se o servidor está online.
  get "up" => "rails/health#show", as: :rails_health_check

  # --- ROTAS DE REUNIÕES ---
  resources :ciclos, only: [] do
    resources :reunioes, only: [:create, :destroy]
  end
end