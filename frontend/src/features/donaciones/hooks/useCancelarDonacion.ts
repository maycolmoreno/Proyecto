import { useMutation, useQueryClient } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';

// Hook puro — cancelar donación (dueño), invalida detalle + listado.
export function useCancelarDonacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => donacionesApi.cancelar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['donaciones', id] });
      queryClient.invalidateQueries({ queryKey: ['donaciones'] });
    },
  });
}
