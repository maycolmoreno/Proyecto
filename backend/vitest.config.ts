import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Fase 6, sección 9 (RNF-009) — pruebas de integración de los flujos core sobre Postgres/MongoDB
// reales (mismo entorno de docker-compose, sin dobles/mocks de infraestructura — proyecto de
// escala académica). Ejecutar con `docker compose exec api npm test` para resolver DB_POSTGRES_URL/
// MONGODB_URI (hostnames internos de Docker, `postgres`/`mongo`).
export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, 'domain'),
      '@application': path.resolve(__dirname, 'application'),
      '@adapters': path.resolve(__dirname, 'adapters'),
      '@main': path.resolve(__dirname, 'main'),
    },
  },
});
