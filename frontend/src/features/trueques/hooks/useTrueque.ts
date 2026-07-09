import { useQuery } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';

// Hook puro — detalle de un trueque (incluye propuestas visibles según autorización del backend).
export function useTrueque(id: string | undefined) {
  return useQuery({
    queryKey: ['trueques', id],
    queryFn: () => truequesApi.obtener(id!),
    enabled: Boolean(id),
  });
}
