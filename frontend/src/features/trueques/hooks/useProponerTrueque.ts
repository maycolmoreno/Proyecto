import { useMutation, useQueryClient } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';
import type { ProponerTruequeInput } from '../types/index.js';

// Hook puro (RF-012/CU-008) — NO auto-acepta; crea la propuesta PENDIENTE en el trueque origen.
export function useProponerTrueque(truequeOrigenId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProponerTruequeInput) => truequesApi.proponer(truequeOrigenId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trueques', truequeOrigenId] });
    },
  });
}
