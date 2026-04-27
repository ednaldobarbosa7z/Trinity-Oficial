# backend-api/Dockerfile (Versão de Desenvolvimento)
# --- A BASE ---
# Define a imagem oficial do Ruby que servirá de alicerce. 
# Usar a versão exata (3.4.7) evita que o projeto quebre no futuro se o Ruby atualizar sozinho.
FROM ruby:3.4.7

# --- DEPENDÊNCIAS DO SISTEMA OPERACIONAL ---
# O Rails (e o Postgres) precisam de ferramentas do Linux para compilar algumas extensões.
# apt-get update: Atualiza a lista de pacotes.
# postgresql-client: Permite que o Rails "fale" com o banco de dados.
# build-essential & libpq-dev: Necessários para instalar a gem 'pg' (driver do Postgres).
RUN apt-get update -qq && apt-get install -y postgresql-client build-essential libpq-dev nodejs npm

# --- ORGANIZAÇÃO ---
# Cria e define a pasta dentro do container onde o código vai morar.
WORKDIR /app

# --- INSTALAÇÃO DE DEPENDÊNCIAS (GEMS) ---
# Copiamos primeiro apenas os arquivos de dependências. 
# Isso é um truque de performance: o Docker "cacheia" as gems e não precisa reinstalar tudo 
# toda vez que você mudar uma linha de código no Rails.
COPY Gemfile Gemfile.lock ./

# Executa o instalador de bibliotecas do Ruby.
RUN bundle install

# --- CÓDIGO FONTE ---
# Copia o restante dos arquivos do seu computador para dentro do container.
COPY . .

# --- REDE ---
# Informa que o container vai escutar na porta 3000 (padrão do Rails).
EXPOSE 3000

# --- O TRATAMENTO DE ERROS (ENTRYPOINT) ---
# O Rails tem uma "chatice": se o container cair, ele deixa um arquivo 'server.pid'. 
# Se esse arquivo existir, o servidor não sobe de novo. 
# O entrypoint.sh é um script que apaga esse arquivo toda vez que o container inicia.
COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

# --- INICIALIZAÇÃO ---
# O comando final que liga o servidor.
# -b 0.0.0.0: Diz ao Rails para aceitar conexões de fora do container (essencial no Docker).
CMD ["rails", "server", "-b", "0.0.0.0"]