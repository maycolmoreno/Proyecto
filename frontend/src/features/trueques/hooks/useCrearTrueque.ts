import { useMutation, useQueryClient } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';
import type { CrearTruequeInput } from '../types/index.js';

// Hook puro (RF-011/CU-007).
export function useCrearTrueque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearTruequeInput) => truequesApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trueques'] });
    },
  });
}
