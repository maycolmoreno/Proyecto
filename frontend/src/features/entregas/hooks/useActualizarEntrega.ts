import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entregasApi, type ActualizarEntregaInput } from '../api/entregas.api.js';

// Hook puro (CU-010) — confirmar/cancelar. Invalida la búsqueda por referencia para reflejar el
// nuevo estado (y, tras confirmar, el estado terminal en cascada del aggregate origen).
export function useActualizarEntrega(idReferencia: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActualizarEntregaInput }) => entregasApi.actualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas', 'por-referencia', idReferencia] });
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['donaciones'] });
    },
  });
}
