import { httpClient } from '@shared/lib/http-client';
import type { ClasificarInput, ClasificacionResultado, MatchResultado, EntidadTipoIA } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1).
export const iaApi = {
  clasificar: (input: ClasificarInput) => httpClient.post<ClasificacionResultado>('/ia/clasificar', input),
  matching: (entidadTipo: EntidadTipoIA, entidadId: string) =>
    httpClient.get<MatchResultado[]>(`/ia/matching?entidadTipo=${entidadTipo}&entidadId=${entidadId}`),
};
