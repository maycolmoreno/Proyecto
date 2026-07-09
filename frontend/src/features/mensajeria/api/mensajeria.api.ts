import { httpClient, ApiError } from '@shared/lib/http-client';
import type { Conversacion } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1). `:id` en las rutas es el OTRO participante, no un
// id de conversación (ver fase-06-backend.md historial, Sprint 5) — la conversación se crea
// implícitamente al primer mensaje.
export const mensajeriaApi = {
  listarConversaciones: () => httpClient.get<Conversacion[]>('/conversaciones'),
  listarMensajes: async (otroParticipanteId: string): Promise<Conversacion | null> => {
    try {
      return await httpClient.get<Conversacion>(`/conversaciones/${otroParticipanteId}/mensajes`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  enviarMensaje: (otroParticipanteId: string, texto: string) =>
    httpClient.post<Conversacion>(`/conversaciones/${otroParticipanteId}/mensajes`, { texto }),
};
