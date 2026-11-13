Rails.application.routes.draw do
  post "/auth/login", to: "authentication#login"
  get "/users/perfil", to: "users#perfil"
  put "/users/perfil", to: "users#update_perfil"
  get "/users/:id/perfil_publico", to: "users#perfil_publico"
  resources :users, only: :create

  put "/clubes/discord", to: "clubes#atualizar_discord"
  resources :clubes, only: :create do
    collection do
      post :entrar
      get :meu_clube
      get :catalogo
    end
    member do
      get :ciclos, to: "clubes#ciclos_index"
      get "ciclo_detalhes/:mes/:ano", to: "clubes#ciclo_detalhes"
      put :update_ciclo_admin
      put :update_slot_admin
      post "ciclos/mensal", to: "ciclos#create_mensal"
      post "salvar_filme/:slot_id", to: "ciclos#salvar_filme"
      delete "ciclos/:ciclo_id", to: "ciclos#destroy"
    end
    resources :filmes, only: [ :index, :create ]
    get :statistics, to: "statistics#index"
  end

  resources :avaliacoes, only: :create do
    post :toggle_like, on: :member, to: "curtidas_avaliacoes#toggle_like"
  end
  get "/avaliacoes/filme/:filme_id", to: "avaliacoes#index_por_filme"
  resources :ciclos, only: [] do
    resources :reunioes, only: [ :create, :destroy ]
  end
  get "up" => "rails/health#show", as: :rails_health_check
end
