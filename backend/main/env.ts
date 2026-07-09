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
  MONGODB_URI: requerida('MONGODB_URI'),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // Opcionales a nivel de arranque: solo se exigen al invocar POST /donaciones/:id/imagenes/firma
  // (CloudinariaAdapter) o los endpoints de IA (ClaudeAdapter), para no bloquear el resto de la
  // API si aún no hay credenciales configuradas (RNF-002 — integraciones externas no bloquean
  // el flujo principal).
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET ?? '',
  IA_API_KEY: process.env.IA_API_KEY ?? '',
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ?? '',
};
