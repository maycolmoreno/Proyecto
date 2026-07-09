import { useQuery } from '@tanstack/react-query';
import { solicitudesApi } from '../api/solicitudes.api.js';
import type { ListarSolicitudesFiltros } from '../types/index.js';

// Hook puro — listado paginado + filtros.
export function useSolicitudes(filtros: ListarSolicitudesFiltros) {
  return useQuery({
    queryKey: ['solicitudes', filtros],
    queryFn: () => solicitudesApi.listar(filtros),
  });
}
