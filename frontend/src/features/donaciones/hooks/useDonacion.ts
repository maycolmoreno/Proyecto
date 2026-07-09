import { useQuery } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';

// Hook puro — detalle de una donación.
export function useDonacion(id: string | undefined) {
  return useQuery({
    queryKey: ['donaciones', id],
    queryFn: () => donacionesApi.obtener(id!),
    enabled: Boolean(id),
  });
}
