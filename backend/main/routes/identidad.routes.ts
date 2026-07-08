import { Router } from 'express';
import { authController, usuariosController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// Fase 4, sección 3 (BC-Identidad).
router.post('/auth/registro', authController.registro);
router.post('/auth/login', authController.login);
router.get('/usuarios/me', authMiddleware, usuariosController.me);

export { router as identidadRouter };
