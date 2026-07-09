import { Router } from 'express';
import { solicitudesController, container } from '../di-container.js';
import { crearAuthMiddleware, crearAuthOpcionalMiddleware } from '../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../middlewares/rbac.middleware.js';
import { crearAuditMiddleware, idDesdeParametro, idDesdeRespuesta, idDeOfertaAceptada } from '../middlewares/audit.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const authOpcionalMiddleware = crearAuthOpcionalMiddleware(container.tokenService);
const beneficiarioOComunidad = rbacMiddleware(['BENEFICIARIO', 'USUARIO_COMUNIDAD']);
const donanteOComunidad = rbacMiddleware(['DONANTE', 'USUARIO_COMUNIDAD']);

const auditarCreacion = crearAuditMiddleware(container.auditoriaRepository, 'CREAR', 'SOLICITUD', idDesdeRespuesta);
const auditarCancelacion = crearAuditMiddleware(
  container.auditoriaRepository,
  'CANCELAR',
  'SOLICITUD',
  idDesdeParametro('id'),
  (req) => req.body?.cancelar === true,
);
const auditarAprobarOferta = crearAuditMiddleware(container.auditoriaRepository, 'APROBAR', 'OFERTA', idDeOfertaAceptada);

// Fase 4, sección 3 (BC-Solicitudes).
router.post('/solicitudes', authMiddleware, beneficiarioOComunidad, auditarCreacion, solicitudesController.crear);
router.get('/solicitudes', authOpcionalMiddleware, solicitudesController.listar);
router.get('/solicitudes/:id', authOpcionalMiddleware, solicitudesController.obtener);
router.patch('/solicitudes/:id', authMiddleware, auditarCancelacion, solicitudesController.actualizar);
router.post(
  '/solicitudes/:id/ofertas',
  authMiddleware,
  donanteOComunidad,
  auditarAprobarOferta,
  solicitudesController.crearOfertaHandler,
);
router.patch('/solicitudes/:id/ofertas/:ofertaId', authMiddleware, solicitudesController.actualizarOfertaHandler);

export { router as solicitudesRouter };
