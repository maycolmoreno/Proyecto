import { z } from 'zod';
import { ACCIONES_MODERACION } from '@domain/administracion/services/ModeracionService.js';
import { ROLES } from '@domain/identidad/value-objects/Rol.js';
import { ESTADOS_USUARIO } from '@domain/identidad/value-objects/EstadoUsuario.js';

// Fase 4, sección 3-4 (BC-Administración).
export const moderarSchema = z.object({
  accion: z.enum(ACCIONES_MODERACION),
  motivo: z.string().max(500).optional(),
});

// Sprint F4 (frontend) — extensión post-cierre, GET /admin/usuarios.
export const listarUsuariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  rol: z.enum(ROLES).optional(),
  estado: z.enum(ESTADOS_USUARIO).optional(),
});
