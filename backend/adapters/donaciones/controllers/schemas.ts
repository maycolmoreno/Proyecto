import { z } from 'zod';
import { ESTADOS_OBJETO } from '@domain/donaciones/value-objects/EstadoObjeto.js';
import { ESTADOS_DONACION } from '@domain/donaciones/value-objects/EstadoDonacion.js';

const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Fase 4, sección 4-5 (BC-Donaciones).
const ubicacionRetiroSchema = z.object({
  provincia: z.string().min(1).max(100),
  ciudad: z.string().min(1).max(100),
  sector: z.string().max(150).optional(),
  referencia: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});

export const crearDonacionSchema = z
  .object({
    titulo: z.string().min(1).max(150),
    descripcion: z.string().min(1),
    categoriaId: z.string().uuid(),
    estadoObjeto: z.enum(ESTADOS_OBJETO),
    requiereRetiro: z.boolean(),
    ubicacionRetiro: ubicacionRetiroSchema.optional(),
  })
  // Regla de negocio #5 (Fase 3): requiere_retiro = true exige ubicacionRetiro completo.
  .refine((data) => !data.requiereRetiro || !!data.ubicacionRetiro, {
    message: 'requiereRetiro=true exige indicar ubicacionRetiro (provincia y ciudad como mínimo).',
    path: ['ubicacionRetiro'],
  });

export const actualizarDonacionSchema = z
  .object({
    titulo: z.string().min(1).max(150).optional(),
    descripcion: z.string().min(1).optional(),
    estadoObjeto: z.enum(ESTADOS_OBJETO).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe incluir al menos un campo a actualizar.' });

export const listarDonacionesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  estado: z.enum(ESTADOS_DONACION).optional(),
  categoriaId: z.string().uuid().optional(),
  provincia: z.string().optional(),
  ciudad: z.string().optional(),
  requiereRetiro: z.coerce.boolean().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  sort: z.enum(['fecha_asc', 'fecha_desc']).default('fecha_desc'),
});

export const firmarImagenSchema = z.object({
  mimeType: z.enum(MIME_TYPES_PERMITIDOS),
  tamanoBytes: z.number().int().positive(),
});

export const registrarImagenSchema = z.object({
  url: z.string().url().max(500),
  publicId: z.string().min(1).max(255),
});
