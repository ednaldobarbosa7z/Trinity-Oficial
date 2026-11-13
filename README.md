<h1 align="center">🎬 Trinity Movie Club</h1>

<p align="center">
  <img src="frontend-app/public/logo.png" width="430"/>
</p>

<p align="center">
Plataforma para clubes de cinema com catálogo colaborativo, avaliações em grupo e organização de ciclos temáticos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Ruby_on_Rails-8.1-red" />
  <img src="https://img.shields.io/badge/Angular-21-dd0031" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Funcionalidades

- Busca e catálogo de filmes via TMDB  
- Organização de ciclos temáticos e sessões do clube  
- Sistema colaborativo de avaliações e médias  
- Notificações automáticas com Discord Webhooks  
- Dashboard responsivo com suporte a Dark Mode  
- Estatísticas de filmes assistidos e re-watch do grupo  

---

## 🏗 Arquitetura

```text
Angular Frontend
      ↓
Ruby on Rails API
      ↓
PostgreSQL
```

Arquitetura separada em frontend e backend desacoplados, containerizados com Docker Compose.

---

## 🚀 Stack Tecnológica

### Backend
- Ruby on Rails 8.1 (API Mode)
- PostgreSQL 15
- Active Record
- REST API

### Frontend
- Angular
- TypeScript
- SCSS
- Responsive UI

### DevOps
- Docker
- Docker Compose

### Integrações
- TMDB API
- Discord Webhooks

---

## 📂 Estrutura do Projeto

```text
.
├── backend-api/
├── frontend-app/
├── docker-compose.yml
└── README.md
```

### Diretórios

- `backend-api/` → API Rails  
- `frontend-app/` → Aplicação Angular

---

## Executar com Docker Desktop

O Docker Desktop com containers Linux é o único pré-requisito. Ruby, Node e PostgreSQL são instalados nas imagens.

Na pasta raiz do projeto, execute uma vez:

```powershell
docker compose up --build -d --wait --wait-timeout 300
```

A primeira execução baixa as dependências e pode demorar. Depois, acesse **http://localhost:4200**. A API fica em http://localhost:3000/up e o PostgreSQL em localhost:5435.

Os quatro serviços usam `restart: always`: depois de criados, voltam a iniciar sempre que o Docker Desktop iniciar. Se quiser iniciar também ao entrar no Windows, ative **Start Docker Desktop when you sign in to your computer** nas configurações gerais do Docker Desktop.

A API espera o PostgreSQL ficar disponível e executa `rails db:prepare`, criando o banco e aplicando migrações pendentes. Os dados do PostgreSQL, os uploads e os arquivos temporários da API ficam em volumes persistentes. O código fica nas imagens; depois de alterar o código, execute novamente o comando acima.

### Configuração opcional e busca de filmes

O projeto sobe sem `.env`, usando configurações locais de desenvolvimento. Para habilitar a busca de filmes no TMDB:

```powershell
Copy-Item .env.example .env
```

Preencha `TMDB_API_KEY` no `.env` e aplique:

```powershell
docker compose up -d
```

A chave TMDB é usada pelo Angular e fica visível no navegador. O Docker gera `environment.ts` automaticamente dentro do container. Sem a chave, a aplicação inicia, mas a busca no TMDB não funciona.

A senha padrão local do PostgreSQL é `trinity_local`. Se já existir um volume de banco com outra senha, informe a senha original em `DATABASE_PASSWORD` no `.env`; alterar essa variável não troca a senha de um banco existente. As portas são publicadas apenas no computador local. Esta configuração é para desenvolvimento local.

O serviço adicional `jobs` processa notificações do Discord em segundo plano. Veja [as regras, paginação e testes do back-end](backend-api/README.md).

### Comandos úteis

```powershell
# Estado e logs
docker compose ps
docker compose logs -f
docker compose logs -f api
docker compose logs -f web

# Parar agora; volta a iniciar quando o Docker Desktop reiniciar
docker compose stop

# Iniciar novamente manualmente
docker compose up -d

# Remover containers e desativar a inicialização automática
# Mantém os volumes; para reativar, execute docker compose up -d
docker compose down
```

Não use `docker compose down -v` se quiser manter os dados: a opção `-v` apaga os volumes do projeto.

---
## 💡 Objetivo do Projeto

Projeto pessoal para estudo de arquitetura full stack, APIs, integração entre serviços e experiência colaborativa para comunidades de cinema.

---

## 📄 Licença

Distribuído sob licença MIT.

Veja:

```text
LICENSE
```

---

## 👨‍💻 Autor

**Ednaldo Carlos Barbosa Júnior**

LinkedIn:  
https://www.linkedin.com/in/ednaldojunior977/
