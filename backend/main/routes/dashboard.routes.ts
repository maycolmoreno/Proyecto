import { Router } from 'express';
import { dashboardController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// Fase 4, sección 3 (Dashboard).
router.get('/dashboard/impacto', authMiddleware, dashboardController.obtenerImpacto);

export { router as dashboardRouter };
