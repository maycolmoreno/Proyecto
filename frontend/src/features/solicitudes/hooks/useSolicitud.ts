import { useQuery } from '@tanstack/react-query';
import { solicitudesApi } from '../api/solicitudes.api.js';

// Hook puro — detalle de una solicitud (incluye ofertas visibles según ADR-019).
export function useSolicitud(id: string | undefined) {
  return useQuery({
    queryKey: ['solicitudes', id],
    queryFn: () => solicitudesApi.obtener(id!),
    enabled: Boolean(id),
  });
}
