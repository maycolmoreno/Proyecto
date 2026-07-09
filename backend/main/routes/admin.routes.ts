import { Router } from 'express';
import { adminController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../middlewares/rbac.middleware.js';
import { crearAuditMiddlewaresModeracion } from '../middlewares/audit.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const soloAdministrador = rbacMiddleware(['ADMINISTRADOR']);

const auditarDonaciones = crearAuditMiddlewaresModeracion(container.auditoriaRepository, 'DONACION');
const auditarSolicitudes = crearAuditMiddlewaresModeracion(container.auditoriaRepository, 'SOLICITUD');
const auditarTrueques = crearAuditMiddlewaresModeracion(container.auditoriaRepository, 'TRUEQUE');
const auditarUsuarios = crearAuditMiddlewaresModeracion(container.auditoriaRepository, 'USUARIO');

// Fase 4, sección 3 (BC-Administración) — RF-018/CU-011, ADMINISTRADOR únicamente.
router.get('/admin/reportes', authMiddleware, soloAdministrador, adminController.reportes);
// Sprint F4 (frontend) — extensión post-cierre, ver docs/fases/fase-06-backend.md historial.
router.get('/admin/usuarios', authMiddleware, soloAdministrador, adminController.listarUsuarios);
router.patch(
  '/admin/donaciones/:id/moderar',
  authMiddleware,
  soloAdministrador,
  ...auditarDonaciones,
  adminController.moderarDonacion,
);
router.patch(
  '/admin/solicitudes/:id/moderar',
  authMiddleware,
  soloAdministrador,
  ...auditarSolicitudes,
  adminController.moderarSolicitud,
);
router.patch(
  '/admin/trueques/:id/moderar',
  authMiddleware,
  soloAdministrador,
  ...auditarTrueques,
  adminController.moderarTrueque,
);
router.patch(
  '/admin/usuarios/:id/moderar',
  authMiddleware,
  soloAdministrador,
  ...auditarUsuarios,
  adminController.moderarUsuario,
);

export { router as adminRouter };
