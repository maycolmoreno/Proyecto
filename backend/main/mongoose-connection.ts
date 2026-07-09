import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

// Primer módulo que necesita MongoDB (Sprint 4 — chatbot_conversaciones, analisis_ia, Fase 3
// sección 4). Conexión única — composition root (Clean Architecture, capa Frameworks & Drivers).
mongoose.connect(env.MONGODB_URI).catch((err) => {
  logger.error({ err }, 'Error al conectar a MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'Error de conexión MongoDB');
});

export { mongoose };
