FROM node:22-bookworm-slim

WORKDIR /app
ENV NG_CLI_ANALYTICS=false
RUN npm install --global npm@11.6.2

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE 4200
ENTRYPOINT ["node", "/app/docker-entrypoint.cjs"]
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
