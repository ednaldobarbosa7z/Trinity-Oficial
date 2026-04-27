# frontend-app/Dockerfile

# Usa uma imagem do Node.js
FROM node:20

# Define diretório de trabalho
WORKDIR /app

# Instala o Angular CLI globalmente dentro do container
RUN npm install -g @angular/cli

# Copia os arquivos de dependência e instala
COPY package.json package-lock.json ./
RUN npm install

# Copia o resto do código
COPY . .

# Expõe a porta 4200
EXPOSE 4200

# Inicia o servidor permitindo acesso externo (host 0.0.0.0)
CMD ["ng", "serve", "--host", "0.0.0.0"]