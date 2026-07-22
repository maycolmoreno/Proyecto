import { httpClient } from '@shared/lib/http-client';
import type { PublicacionIndexEntry } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1).
export const publicacionesApi = {
  listarMias: () => httpClient.get<PublicacionIndexEntry[]>('/publicaciones/mias'),
};
