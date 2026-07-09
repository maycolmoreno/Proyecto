import { Router } from 'express';
import { entregasController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// Fase 4, sección 3 (BC-Entregas). Se crean automáticamente al aceptar una oferta/propuesta — no hay POST público.
// Ruta estática declarada ANTES de /entregas/:id (Express resuelve por orden, a diferencia de
// React Router) — extensión Sprint F2 (frontend), ver historial de fase-06-backend.md.
router.get('/entregas/por-referencia/:idReferencia', authMiddleware, entregasController.obtenerPorReferencia);
router.get('/entregas/:id', authMiddleware, entregasController.obtener);
router.patch('/entregas/:id', authMiddleware, entregasController.actualizar);

export { router as entregasRouter };
