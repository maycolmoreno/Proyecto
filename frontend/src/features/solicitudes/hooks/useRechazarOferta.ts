import { useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudesApi } from '../api/solicitudes.api.js';

// Hook puro (RF-010) — revierte la solicitud a ABIERTA en el backend.
export function useRechazarOferta(solicitudId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ofertaId: string) => solicitudesApi.rechazarOferta(solicitudId, ofertaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes', solicitudId] });
    },
  });
}
