import { Router } from 'express';
import { mensajeriaController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// Fase 4, sección 3 (BC-Mensajería).
router.get('/conversaciones', authMiddleware, mensajeriaController.listarConversaciones);
router.get('/conversaciones/:id/mensajes', authMiddleware, mensajeriaController.listarMensajes);
router.post('/conversaciones/:id/mensajes', authMiddleware, mensajeriaController.enviarMensaje);

export { router as mensajeriaRouter };
