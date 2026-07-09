import { z } from 'zod';

// Fase 4, sección 3 (BC-Entregas) — confirmar o cancelar, no ambos a la vez.
export const actualizarEntregaSchema = z
  .object({
    confirmar: z.literal(true).optional(),
    cancelar: z.literal(true).optional(),
    fechaProgramada: z.coerce.date().optional(),
  })
  .refine((data) => data.confirmar === true || data.cancelar === true, {
    message: 'Debe indicar confirmar o cancelar.',
  })
  .refine((data) => !(data.confirmar === true && data.cancelar === true), {
    message: 'No puede confirmar y cancelar en la misma solicitud.',
  });
