import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './env.js';
import { logger } from './logger.js';
import { prisma } from './prisma-client.js';
import { identidadRouter } from './routes/identidad.routes.js';
import { categoriasRouter } from './routes/categorias.routes.js';
import { donacionesRouter } from './routes/donaciones.routes.js';
import { solicitudesRouter } from './routes/solicitudes.routes.js';
import { entregasRouter } from './routes/entregas.routes.js';
import { truequesRouter } from './routes/trueques.routes.js';
import { iaRouter } from './routes/ia.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { mensajeriaRouter } from './routes/mensajeria.routes.js';
import { notificacionesRouter } from './routes/notificaciones.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { publicacionesRouter } from './routes/publicaciones.routes.js';
import { favoritosRouter } from './routes/favoritos.routes.js';
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
app.use('/api/v1', categoriasRouter);
app.use('/api/v1', donacionesRouter);
app.use('/api/v1', solicitudesRouter);
app.use('/api/v1', entregasRouter);
app.use('/api/v1', truequesRouter);
app.use('/api/v1', iaRouter);
app.use('/api/v1', adminRouter);
app.use('/api/v1', mensajeriaRouter);
app.use('/api/v1', notificacionesRouter);
app.use('/api/v1', dashboardRouter);
app.use('/api/v1', publicacionesRouter);
app.use('/api/v1', favoritosRouter);

app.use(errorHandlerMiddleware);

/* c8 ignore start */
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info(`DonaConnect API escuchando en puerto ${env.PORT}`);
  });
}
/* c8 ignore stop */
