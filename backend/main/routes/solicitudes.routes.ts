import { Router } from 'express';
import { solicitudesController, container } from '../di-container.js';
import { crearAuthMiddleware, crearAuthOpcionalMiddleware } from '../middlewares/auth.middleware.js';
import { perfilMiddleware } from '../middlewares/perfil.middleware.js';
import { crearAuditMiddleware, idDesdeParametro, idDesdeRespuesta, idDeOfertaAceptada } from '../middlewares/audit.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const authOpcionalMiddleware = crearAuthOpcionalMiddleware(container.tokenService);
// Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md) — antes rbacMiddleware(['BENEFICIARIO'|'DONANTE','USUARIO_COMUNIDAD']).
// COMUNIDAD removido del perfil (ADR-049).
const soloSolicitante = perfilMiddleware(['SOLICITANTE']);
const soloDonante = perfilMiddleware(['DONANTE']);

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
router.post('/solicitudes', authMiddleware, soloSolicitante, auditarCreacion, solicitudesController.crear);
router.get('/solicitudes', authOpcionalMiddleware, solicitudesController.listar);
router.get('/solicitudes/:id', authOpcionalMiddleware, solicitudesController.obtener);
router.patch('/solicitudes/:id', authMiddleware, auditarCancelacion, solicitudesController.actualizar);
router.post(
  '/solicitudes/:id/ofertas',
  authMiddleware,
  soloDonante,
  auditarAprobarOferta,
  solicitudesController.crearOfertaHandler,
);
router.patch('/solicitudes/:id/ofertas/:ofertaId', authMiddleware, solicitudesController.actualizarOfertaHandler);

export { router as solicitudesRouter };
