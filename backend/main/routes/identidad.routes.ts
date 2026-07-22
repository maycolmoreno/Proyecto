import { Router } from 'express';
import { authController, usuariosController, container } from '../di-container.js';
import { crearAuthMiddleware } from '../middlewares/auth.middleware.js';
import { crearAuditMiddleware, idDesdeRespuesta } from '../middlewares/audit.middleware.js';

const router = Router();
const authMiddleware = crearAuthMiddleware(container.tokenService);
const auditarRegistro = crearAuditMiddleware(container.auditoriaRepository, 'CREAR', 'USUARIO', idDesdeRespuesta);

// Fase 4, sección 3 (BC-Identidad).
router.post('/auth/registro', auditarRegistro, authController.registro);
router.post('/auth/login', authController.login);
router.get('/usuarios/me', authMiddleware, usuariosController.me);
// Extensión post-cierre (Sprint F5 frontend) — declarada después de /usuarios/me (Express resuelve
// por orden; :id capturaría "me" si fuera declarada antes, mismo criterio que entregas.routes.ts).
router.get('/usuarios/:id', authMiddleware, usuariosController.obtenerPorId);
// Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md). Verbo PATCH, sin colisión de orden con el
// GET /usuarios/:id de arriba (verbos distintos).
router.patch('/usuarios/me/perfiles', authMiddleware, usuariosController.actualizarPerfiles);
// Ubicación de perfil — cierra el gap documentado en PerfilPage.tsx (tab "Ubicación" sin backend).
router.patch('/usuarios/me/ubicacion', authMiddleware, usuariosController.actualizarUbicacion);

export { router as identidadRouter };
