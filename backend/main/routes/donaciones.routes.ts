import { Router } from 'express';
import { donacionesController, container } from '../di-container.js';
import { crearAuthMiddleware, crearAuthOpcionalMiddleware } from '../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../middlewares/rbac.middleware.js';
import { crearAuditMiddleware, idDesdeParametro, idDesdeRespuesta } from '../middlewares/audit.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const authOpcionalMiddleware = crearAuthOpcionalMiddleware(container.tokenService);
const donanteOComunidad = rbacMiddleware(['DONANTE', 'USUARIO_COMUNIDAD']);
const auditarCreacion = crearAuditMiddleware(container.auditoriaRepository, 'CREAR', 'DONACION', idDesdeRespuesta);
const auditarCancelacion = crearAuditMiddleware(
  container.auditoriaRepository,
  'CANCELAR',
  'DONACION',
  idDesdeParametro('id'),
);

// Fase 4, sección 3 (BC-Donaciones).
router.post('/donaciones', authMiddleware, donanteOComunidad, auditarCreacion, donacionesController.crear);
router.get('/donaciones', authOpcionalMiddleware, donacionesController.listar);
router.get('/donaciones/:id', authOpcionalMiddleware, donacionesController.obtener);
router.patch('/donaciones/:id', authMiddleware, donacionesController.actualizar);
router.delete('/donaciones/:id', authMiddleware, auditarCancelacion, donacionesController.cancelar);
router.post('/donaciones/:id/imagenes/firma', authMiddleware, donacionesController.firmarImagen);
router.post('/donaciones/:id/imagenes', authMiddleware, donacionesController.registrarImagenSubida);

export { router as donacionesRouter };
