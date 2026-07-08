# Fase 10 — Node 22 LTS (ADR-041), imagen de una sola etapa (entorno objetivo: localhost, ADR-000)
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
