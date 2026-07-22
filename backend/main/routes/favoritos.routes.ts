import { Router } from 'express';
import { favoritosController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);

// BC-Favoritos — sin gate de perfil funcional: cualquier usuario autenticado puede guardar
// cualquiera de las 3 publicaciones (a diferencia de crear/reservar, esto no depende de rol de mercado).
router.post('/favoritos', authMiddleware, favoritosController.agregar);
router.delete('/favoritos/:tipoEntidad/:entidadId', authMiddleware, favoritosController.quitar);
router.get('/favoritos', authMiddleware, favoritosController.listar);

export { router as favoritosRouter };
