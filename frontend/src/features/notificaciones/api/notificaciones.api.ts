import { httpClient } from '@shared/lib/http-client';
import type { Notificacion } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1).
export const notificacionesApi = {
  listar: () => httpClient.get<Notificacion[]>('/notificaciones'),
  marcarLeido: (id: string) => httpClient.patch<void>(`/notificaciones/${id}/leido`),
};
