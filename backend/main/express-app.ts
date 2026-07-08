import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './env.js';
import { logger } from './logger.js';
import { prisma } from './prisma-client.js';
import { identidadRouter } from './routes/identidad.routes.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: false }));
app.use(express.json());
app.use(pinoHttp({ logger }));

// Fase 10, sección 5 — monitoreo mínimo: healthcheck usado por Docker Compose.
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

// Fase 4, sección 1 — versionado de API.
app.use('/api/v1', identidadRouter);

app.use(errorHandlerMiddleware);

/* c8 ignore start */
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info(`DonaConnect API escuchando en puerto ${env.PORT}`);
  });
}
/* c8 ignore stop */
