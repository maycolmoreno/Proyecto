import { useQuery } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';
import type { ListarDonacionesFiltros } from '../types/index.js';

// Hook puro — listado paginado + filtros (Fase 4, sección 8). `enabled` opcional: lo usa
// HomePage para la vista de visitante (no autenticado) sin forzar el fetch en la vista de
// dashboard, que no lo necesita (auditoría de espacio muerto 2026-07-21).
export function useDonaciones(filtros: ListarDonacionesFiltros, opciones?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['donaciones', filtros],
    queryFn: () => donacionesApi.listar(filtros),
    enabled: opciones?.enabled ?? true,
  });
}
