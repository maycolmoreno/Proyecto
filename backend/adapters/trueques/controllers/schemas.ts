import { z } from 'zod';
import { ESTADOS_OBJETO } from '@domain/trueques/value-objects/EstadoObjeto.js';
import { ESTADOS_TRUEQUE } from '@domain/trueques/value-objects/EstadoTrueque.js';

const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Fase 4, sección 4-5 (BC-Trueques).
export const crearTruequeSchema = z.object({
  titulo: z.string().min(1).max(150),
  descripcion: z.string().min(1),
  categoriaId: z.string().uuid(),
  estadoObjeto: z.enum(ESTADOS_OBJETO),
});

export const actualizarTruequeSchema = z
  .object({
    titulo: z.string().min(1).max(150).optional(),
    descripcion: z.string().min(1).optional(),
    estadoObjeto: z.enum(ESTADOS_OBJETO).optional(),
    cancelar: z.literal(true).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe incluir al menos un campo a actualizar.' });

export const listarTruequesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  estado: z.enum(ESTADOS_TRUEQUE).optional(),
  categoriaId: z.string().uuid().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  sort: z.enum(['fecha_asc', 'fecha_desc']).default('fecha_desc'),
});

export const proponerTruequeSchema = z.object({
  truequeOfrecidoId: z.string().uuid(),
});

export const responderPropuestaSchema = z
  .object({
    aceptar: z.literal(true).optional(),
    rechazar: z.literal(true).optional(),
  })
  .refine((data) => data.aceptar === true || data.rechazar === true, {
    message: 'Debe indicar aceptar o rechazar.',
  })
  .refine((data) => !(data.aceptar === true && data.rechazar === true), {
    message: 'No puede aceptar y rechazar en la misma solicitud.',
  });

export const firmarImagenSchema = z.object({
  mimeType: z.enum(MIME_TYPES_PERMITIDOS),
  tamanoBytes: z.number().int().positive(),
});

export const registrarImagenSchema = z.object({
  url: z.string().url().max(500),
  publicId: z.string().min(1).max(255),
});
