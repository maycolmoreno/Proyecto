import { useQuery } from '@tanstack/react-query';
import { solicitudesApi } from '../api/solicitudes.api.js';
import type { ListarSolicitudesFiltros } from '../types/index.js';

// Hook puro — listado paginado + filtros. `enabled` opcional: lo usa SolicitudDetallePage para
// agregar "categorías más solicitadas" solo en la vista del dueño (redisño 2026-07-23).
export function useSolicitudes(filtros: ListarSolicitudesFiltros, opciones?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['solicitudes', filtros],
    queryFn: () => solicitudesApi.listar(filtros),
    enabled: opciones?.enabled ?? true,
  });
}
