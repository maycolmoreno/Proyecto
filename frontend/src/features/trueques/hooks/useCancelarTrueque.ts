import { useMutation, useQueryClient } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';

// Hook puro — cancelar trueque (dueño), invalida detalle + listado.
export function useCancelarTrueque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => truequesApi.cancelar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['trueques', id] });
      queryClient.invalidateQueries({ queryKey: ['trueques'] });
    },
  });
}
