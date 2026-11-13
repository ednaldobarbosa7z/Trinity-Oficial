Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # O backend vai aceitar o localhost OU a URL que você definir na nuvem
    origins ENV.fetch("FRONTEND_URL", "http://localhost:4200")

    resource "*",
      headers: :any,
      expose: [ "X-Total-Count", "X-Page", "X-Per-Page" ],
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
  end
end
