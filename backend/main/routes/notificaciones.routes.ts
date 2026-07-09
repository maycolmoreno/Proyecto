import { Router } from 'express';
import { notificacionesController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// Fase 4, sección 3 (BC-Notificaciones).
router.get('/notificaciones', authMiddleware, notificacionesController.listar);
router.patch('/notificaciones/:id/leido', authMiddleware, notificacionesController.marcarLeido);

export { router as notificacionesRouter };
