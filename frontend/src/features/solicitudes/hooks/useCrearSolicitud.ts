import { useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudesApi } from '../api/solicitudes.api.js';
import type { CrearSolicitudInput } from '../types/index.js';

// Hook puro (RF-008/CU-005).
export function useCrearSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearSolicitudInput) => solicitudesApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
    },
  });
}
