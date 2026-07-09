import { z } from 'zod';

// Fase 4, sección 4 (BC-Mensajería). MensajeCreateDTO: `texto` únicamente.
export const enviarMensajeSchema = z.object({
  texto: z.string().min(1),
});
