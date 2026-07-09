import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mensajeriaApi } from '../api/mensajeria.api.js';

// Hook puro (RF-017/CU-015) — invalida el hilo con este participante y el listado de conversaciones.
export function useEnviarMensaje(otroParticipanteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (texto: string) => mensajeriaApi.enviarMensaje(otroParticipanteId, texto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversaciones', otroParticipanteId] });
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
    },
  });
}
