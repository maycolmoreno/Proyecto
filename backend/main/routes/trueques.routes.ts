import { Router } from 'express';
import { truequesController, container } from '../di-container.js';
import { crearAuthMiddleware, crearAuthOpcionalMiddleware } from '../middlewares/auth.middleware.js';
import { perfilMiddleware } from '../middlewares/perfil.middleware.js';
import { crearAuditMiddleware, idDesdeParametro, idDesdeRespuesta } from '../middlewares/audit.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const authOpcionalMiddleware = crearAuthOpcionalMiddleware(container.tokenService);
// Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md) — antes rbacMiddleware(['DONANTE','USUARIO_COMUNIDAD']).
// COMUNIDAD removido del perfil (ADR-049).
const soloTrueque = perfilMiddleware(['TRUEQUE']);

const auditarCreacion = crearAuditMiddleware(container.auditoriaRepository, 'CREAR', 'TRUEQUE', idDesdeRespuesta);
const auditarCancelacion = crearAuditMiddleware(
  container.auditoriaRepository,
  'CANCELAR',
  'TRUEQUE',
  idDesdeParametro('id'),
  (req) => req.body?.cancelar === true,
);
const auditarAprobarPropuesta = crearAuditMiddleware(
  container.auditoriaRepository,
  'APROBAR',
  'PROPUESTA_TRUEQUE',
  idDesdeParametro('propuestaId'),
  (req) => req.body?.aceptar === true,
);

// Fase 4, sección 3 (BC-Trueques).
router.post('/trueques', authMiddleware, soloTrueque, auditarCreacion, truequesController.crear);
router.get('/trueques', authOpcionalMiddleware, truequesController.listar);
router.get('/trueques/:id', authOpcionalMiddleware, truequesController.obtener);
router.patch('/trueques/:id', authMiddleware, auditarCancelacion, truequesController.actualizar);
router.post(
  '/trueques/:id/propuestas',
  authMiddleware,
  soloTrueque,
  truequesController.proponerHandler,
);
router.patch(
  '/trueques/:id/propuestas/:propuestaId',
  authMiddleware,
  auditarAprobarPropuesta,
  truequesController.responderPropuestaHandler,
);
router.post('/trueques/:id/imagenes/firma', authMiddleware, truequesController.firmarImagen);
router.post('/trueques/:id/imagenes', authMiddleware, truequesController.registrarImagenSubida);

export { router as truequesRouter };
