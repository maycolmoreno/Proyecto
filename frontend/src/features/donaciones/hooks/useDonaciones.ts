import { useQuery } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';
import type { ListarDonacionesFiltros } from '../types/index.js';

// Hook puro — listado paginado + filtros (Fase 4, sección 8).
export function useDonaciones(filtros: ListarDonacionesFiltros) {
  return useQuery({
    queryKey: ['donaciones', filtros],
    queryFn: () => donacionesApi.listar(filtros),
  });
}
