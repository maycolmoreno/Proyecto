import { httpClient } from '@shared/lib/http-client';
import type { Categoria } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1). GET /categorias es público (sin auth).
export const categoriasApi = {
  listar: () => httpClient.get<Categoria[]>('/categorias?estado=ACTIVA'),
  // Panel de administración: incluye INACTIVA (sin filtro de estado).
  listarTodas: () => httpClient.get<Categoria[]>('/categorias'),
  crear: (input: { nombre: string; tipo: string }) => httpClient.post<Categoria>('/categorias', input),
  actualizar: (id: string, input: { nombre?: string; tipo?: string; estado?: Categoria['estado'] }) =>
    httpClient.patch<Categoria>(`/categorias/${id}`, input),
};
