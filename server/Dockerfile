# --- build: compila o TypeScript ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# --- deps: só dependências de produção ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci --omit=dev

# --- runtime: imagem final sem código-fonte, sem devDependencies e sem .env ---
FROM node:22-alpine
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
RUN mkdir -p /app/storage /app/tmp && chown -R node:node /app/storage /app/tmp
USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3333/health || exit 1
CMD ["node", "dist/shared/infra/http/server.js"]
