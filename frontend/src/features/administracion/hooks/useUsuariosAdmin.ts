import { useQuery } from '@tanstack/react-query';
import { administracionApi } from '../api/administracion.api.js';
import type { ListarUsuariosFiltros } from '../types/index.js';

// Hook puro — listado paginado de usuarios para el panel de administración (extensión F4, ver
// docs/fases/fase-06-backend.md historial: no existía antes de este sprint).
export function useUsuariosAdmin(filtros: ListarUsuariosFiltros) {
  return useQuery({
    queryKey: ['admin', 'usuarios', filtros],
    queryFn: () => administracionApi.listarUsuarios(filtros),
  });
}
