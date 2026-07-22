import { Router } from 'express';
import { publicacionesController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// Fase 5 diferida (docs/DISENO_MODELO_PERFILES.md sección 7) — BC-Publicaciones (proyección).
router.get('/publicaciones/mias', authMiddleware, publicacionesController.listarMias);

export { router as publicacionesRouter };
