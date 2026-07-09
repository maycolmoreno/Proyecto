import { useQuery } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';
import type { ListarTruequesFiltros } from '../types/index.js';

// Hook puro — listado paginado + filtros.
export function useTrueques(filtros: ListarTruequesFiltros) {
  return useQuery({
    queryKey: ['trueques', filtros],
    queryFn: () => truequesApi.listar(filtros),
  });
}
