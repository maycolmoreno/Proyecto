# Fase 10 — Node 22 LTS (ADR-041). Vite dev server, no build de producción (ADR-000: localhost).
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
