import { z } from 'zod';
import { ACCIONES_MODERACION } from '@domain/administracion/services/ModeracionService.js';

// Fase 4, sección 3-4 (BC-Administración).
export const moderarSchema = z.object({
  accion: z.enum(ACCIONES_MODERACION),
  motivo: z.string().max(500).optional(),
});
