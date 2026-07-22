import { z } from 'zod';
import { PERFILES_FUNCIONALES } from '@domain/identidad/value-objects/PerfilFuncional.js';

// Fase 4, DTOs. RegistroUsuarioDTO / LoginDTO.
// Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md): `rol` deja de ser un campo de registro público
// — el rol de seguridad (ADMINISTRADOR|USUARIO) ya no se elige libremente, se hardcodea USUARIO en
// RegistrarUsuarioUseCase. Lo que el usuario elige ahora es su(s) capacidad(es) de marketplace.
export const registroSchema = z.object({
  nombre: z.string().min(1).max(150),
  correo: z.string().email().max(255),
  password: z.string().min(8).max(72),
  telefono: z.string().max(20).optional(),
  perfiles: z.array(z.enum(PERFILES_FUNCIONALES)).min(1),
  aceptaTerminos: z.literal(true),
});

export const loginSchema = z.object({
  correo: z.string().email(),
  password: z.string().min(1),
});

export const actualizarPerfilesSchema = z.object({
  perfiles: z.array(z.enum(PERFILES_FUNCIONALES)),
});

// Ubicación de perfil (PATCH /usuarios/me/ubicacion) — misma forma que ubicacionRetiroSchema
// (donaciones/controllers/schemas.ts), reutilizada tal cual para no divergir de validación.
export const actualizarUbicacionSchema = z.object({
  provincia: z.string().min(1).max(100),
  ciudad: z.string().min(1).max(100),
  sector: z.string().max(150).optional(),
  referencia: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});
