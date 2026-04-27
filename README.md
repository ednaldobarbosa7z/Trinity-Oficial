<h1 align="center">🎬 Trinity Movie Club</h1>

<p align="center">
  <img src="frontend-app/public/logo.png" width="430"/>
</p>

<p align="center">
Plataforma para clubes de cinema com catálogo colaborativo, avaliações em grupo e organização de ciclos temáticos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Ruby_on_Rails-7-red" />
  <img src="https://img.shields.io/badge/Angular-17-dd0031" />
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
- Ruby on Rails 7 (API Mode)
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

## 🛠 Pré-requisitos

Instale:

- Docker  
- Docker Compose  

---

## ⚙️ Configuração

### 1. Variáveis do projeto

Copie:

```bash
cp .env.example .env
```

Configure:

```env
DATABASE_PASSWORD=sua_senha_aqui
FRONTEND_URL=http://localhost:4200
```

---

### 2. Configurar TMDB

Crie:

```bash
frontend-app/src/environments/environment.ts
```

Conteúdo:

```ts
export const environment = {
  production: false,
  tmdbApiKey: 'SUA_CHAVE_TMDB',
  apiUrl: 'http://localhost:3000'
};
```

---

## ▶️ Executando o projeto

Subir containers:

```bash
docker-compose up --build -d
```

---

## 🔗 Portas

Frontend:

```bash
http://localhost:4200
```

Backend:

```bash
http://localhost:3000
```

PostgreSQL:

```bash
localhost:5435
```

---

## 📖 Comandos úteis

Logs:

```bash
docker-compose logs -f
docker-compose logs -f api
docker-compose logs -f web
```

Parar:

```bash
docker-compose stop
```

Derrubar containers:

```bash
docker-compose down
```

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
