import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesApi } from '../api/notificaciones.api.js';

export function useMarcarLeido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificacionesApi.marcarLeido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });
}
