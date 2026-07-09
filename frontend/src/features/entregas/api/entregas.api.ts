import { httpClient, ApiError } from '@shared/lib/http-client';
import type { Entrega } from '../types/index.js';

export interface ActualizarEntregaInput {
  confirmar?: true;
  cancelar?: true;
  fechaProgramada?: string;
}

// Cliente API del módulo (Fase 1, sección 9.1). No hay POST /entregas público — se crean
// automáticamente al aceptar una oferta/propuesta (Fase 4, sección 3, nota).
export const entregasApi = {
  // GET /entregas/por-referencia/:idReferencia — extensión Sprint F2 (ver historial de
  // fase-06-backend.md). Un 404 es un resultado válido (aún no hay oferta/propuesta aceptada),
  // no un error real — se traduce a `null` en vez de relanzar.
  obtenerPorReferencia: async (idReferencia: string): Promise<Entrega | null> => {
    try {
      return await httpClient.get<Entrega>(`/entregas/por-referencia/${idReferencia}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  actualizar: (id: string, input: ActualizarEntregaInput) => httpClient.patch<Entrega>(`/entregas/${id}`, input),
};
