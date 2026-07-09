import { httpClient } from '@shared/lib/http-client';
import type { Conversacion, EnviarMensajeInput, EnviarMensajeResultado } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1).
export const chatbotApi = {
  enviarMensaje: (input: EnviarMensajeInput) => httpClient.post<EnviarMensajeResultado>('/chatbot/mensajes', input),
  obtenerConversacion: (id: string) => httpClient.get<Conversacion>(`/chatbot/conversaciones/${id}`),
};
