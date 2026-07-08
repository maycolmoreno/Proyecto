function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Variable de entorno faltante: ${nombre}`);
  }
  return valor;
}

// Fase 10, sección 4 — lista completa de variables de entorno.
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: requerida('JWT_SECRET'),
  DB_POSTGRES_URL: requerida('DB_POSTGRES_URL'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
