import { Router } from 'express';
import { categoriasController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../middlewares/rbac.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const soloAdministrador = rbacMiddleware(['ADMINISTRADOR']);

// Fase 4, sección 3 (BC-Categorías, Shared Kernel).
router.get('/categorias', categoriasController.listar);
router.post('/categorias', authMiddleware, soloAdministrador, categoriasController.crear);
router.patch('/categorias/:id', authMiddleware, soloAdministrador, categoriasController.actualizar);

export { router as categoriasRouter };
