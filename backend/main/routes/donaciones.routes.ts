import { Router } from 'express';
import { donacionesController, container } from '../di-container.js';
import { crearAuthMiddleware, crearAuthOpcionalMiddleware } from '../middlewares/auth.middleware.js';
import { perfilMiddleware } from '../middlewares/perfil.middleware.js';
import { crearAuditMiddleware, idDesdeParametro, idDesdeRespuesta } from '../middlewares/audit.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const authOpcionalMiddleware = crearAuthOpcionalMiddleware(container.tokenService);
// Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md) — antes rbacMiddleware(['DONANTE','USUARIO_COMUNIDAD']).
// COMUNIDAD removido del perfil (ADR-049).
const soloDonante = perfilMiddleware(['DONANTE']);
const soloSolicitante = perfilMiddleware(['SOLICITANTE']);
const auditarCreacion = crearAuditMiddleware(container.auditoriaRepository, 'CREAR', 'DONACION', idDesdeRespuesta);
const auditarCancelacion = crearAuditMiddleware(
  container.auditoriaRepository,
  'CANCELAR',
  'DONACION',
  idDesdeParametro('id'),
);
const auditarAprobarReserva = crearAuditMiddleware(
  container.auditoriaRepository,
  'APROBAR',
  'RESERVA_DONACION',
  idDesdeParametro('reservaId'),
  (req) => req.body?.aceptar === true,
);

// Fase 4, sección 3 (BC-Donaciones).
router.post('/donaciones', authMiddleware, soloDonante, auditarCreacion, donacionesController.crear);
router.get('/donaciones', authOpcionalMiddleware, donacionesController.listar);
router.get('/donaciones/:id', authOpcionalMiddleware, donacionesController.obtener);
router.patch('/donaciones/:id', authMiddleware, donacionesController.actualizar);
router.delete('/donaciones/:id', authMiddleware, auditarCancelacion, donacionesController.cancelar);
router.post('/donaciones/:id/imagenes/firma', authMiddleware, donacionesController.firmarImagen);
router.post('/donaciones/:id/imagenes', authMiddleware, donacionesController.registrarImagenSubida);
router.post('/donaciones/:id/reservas', authMiddleware, soloSolicitante, donacionesController.crearReservaHandler);
router.patch(
  '/donaciones/:id/reservas/:reservaId',
  authMiddleware,
  auditarAprobarReserva,
  donacionesController.responderReservaHandler,
);

export { router as donacionesRouter };
