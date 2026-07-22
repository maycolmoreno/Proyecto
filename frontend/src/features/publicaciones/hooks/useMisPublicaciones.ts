import { useQuery } from '@tanstack/react-query';
import { publicacionesApi } from '../api/publicaciones.api.js';

// Hook puro — a diferencia de useNotificaciones, sin polling: esta es una página que el usuario
// visita para consultar su historial, no un badge en vivo.
export function useMisPublicaciones(enabled = true) {
  return useQuery({
    queryKey: ['publicaciones', 'mias'],
    queryFn: () => publicacionesApi.listarMias(),
    enabled,
  });
}
