import { z } from 'zod';

// Fase 4, sección 3-4 (BC-IA).
export const chatbotMensajeSchema = z.object({
  texto: z.string().min(1),
  sesionId: z.string().min(1).optional(),
});

export const clasificarSchema = z.object({
  titulo: z.string().min(1).max(150),
  descripcion: z.string().min(1),
  esSolicitud: z.boolean(),
});

export const matchingQuerySchema = z.object({
  entidadTipo: z.enum(['DONACION', 'SOLICITUD', 'TRUEQUE']),
  entidadId: z.string().uuid(),
});
