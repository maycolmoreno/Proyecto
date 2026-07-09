import { z } from 'zod';
import { URGENCIAS } from '@domain/solicitudes/value-objects/Urgencia.js';
import { ESTADOS_SOLICITUD } from '@domain/solicitudes/value-objects/EstadoSolicitud.js';

// Fase 4, sección 4-5 (BC-Solicitudes). La ubicación es obligatoria (a diferencia de la de
// donación) — Fase 3: solicitudes.id_ubicacion es NOT NULL.
const ubicacionSchema = z.object({
  provincia: z.string().min(1).max(100),
  ciudad: z.string().min(1).max(100),
  sector: z.string().max(150).optional(),
  referencia: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});

export const crearSolicitudSchema = z.object({
  titulo: z.string().min(1).max(150),
  descripcion: z.string().min(1),
  categoriaId: z.string().uuid(),
  urgencia: z.enum(URGENCIAS),
  ubicacion: ubicacionSchema,
  evidenciaUrl: z.string().url().max(500).optional(),
});

export const actualizarSolicitudSchema = z
  .object({
    titulo: z.string().min(1).max(150).optional(),
    descripcion: z.string().min(1).optional(),
    urgencia: z.enum(URGENCIAS).optional(),
    cancelar: z.literal(true).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe incluir al menos un campo a actualizar.' });

export const listarSolicitudesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  estado: z.enum(ESTADOS_SOLICITUD).optional(),
  categoriaId: z.string().uuid().optional(),
  urgencia: z.enum(URGENCIAS).optional(),
  provincia: z.string().optional(),
  ciudad: z.string().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  sort: z.enum(['fecha_asc', 'fecha_desc']).default('fecha_desc'),
});

export const crearOfertaSchema = z.object({
  donacionId: z.string().uuid(),
  mensaje: z.string().max(1000).optional(),
});
