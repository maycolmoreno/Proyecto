import { Router } from 'express';
import { iaController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// Fase 4, sección 3 (BC-IA).
router.post('/chatbot/mensajes', authMiddleware, iaController.chatear);
router.get('/chatbot/conversaciones/:id', authMiddleware, iaController.obtenerConversacion);
router.post('/ia/clasificar', authMiddleware, iaController.clasificar);
router.get('/ia/matching', authMiddleware, iaController.matching);

export { router as iaRouter };
