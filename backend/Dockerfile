# Fase 10 — Node 22 LTS (ADR-041), imagen de una sola etapa (entorno objetivo: localhost, ADR-000)
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

# Sprint 5 (Fase 10 — "docker compose up limpio") — en cada arranque: (1) regenera el Prisma
# Client, porque node_modules vive en un volumen anónimo (docker-compose.yml) separado del bind
# mount del código fuente, así que un cambio de schema.prisma en el host no se refleja en el
# cliente generado hasta que algo lo regenera; (2) aplica migraciones pendientes (`migrate deploy`,
# no-interactivo — a diferencia de `migrate dev`, no genera migraciones nuevas ni pide confirmación)
# para que un volumen de Postgres recién creado (`docker compose down -v && up`) quede listo sin
# pasos manuales. Antes de esto, ambos pasos requerían correrse a mano dentro del contenedor tras
# cada sprint — paso oculto que este entrypoint automatiza.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]
