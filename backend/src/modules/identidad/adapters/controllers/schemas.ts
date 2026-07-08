import { z } from 'zod';
import { ROLES } from '../../domain/value-objects/Rol.js';

// Fase 4, DTOs. RegistroUsuarioDTO / LoginDTO.
export const registroSchema = z.object({
  nombre: z.string().min(1).max(150),
  correo: z.string().email().max(255),
  password: z.string().min(8).max(72),
  telefono: z.string().max(20).optional(),
  rol: z.enum(ROLES),
  aceptaTerminos: z.literal(true),
});

export const loginSchema = z.object({
  correo: z.string().email(),
  password: z.string().min(1),
});
