import { httpClient } from '@shared/lib/http-client';
import type { Categoria } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1). GET /categorias es público (sin auth).
export const categoriasApi = {
  listar: () => httpClient.get<Categoria[]>('/categorias?estado=ACTIVA'),
};
