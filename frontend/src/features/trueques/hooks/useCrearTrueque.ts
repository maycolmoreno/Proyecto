import { useMutation, useQueryClient } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';
import type { CrearTruequeInput } from '../types/index.js';

// Hook puro (RF-011/CU-007). También invalida ['publicaciones', 'mias'] — mismo bug real de
// useCrearSolicitud/useCrearDonacion, reportado por el usuario 2026-07-23.
export function useCrearTrueque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearTruequeInput) => truequesApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trueques'] });
      queryClient.invalidateQueries({ queryKey: ['publicaciones', 'mias'] });
    },
  });
}
