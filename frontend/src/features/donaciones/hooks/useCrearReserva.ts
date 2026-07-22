import { useMutation, useQueryClient } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';
import type { CrearReservaInput } from '../types/index.js';

// Hook puro ("Quiero este artículo") — NO auto-acepta; crea la reserva PENDIENTE, el donante
// decide en un segundo paso (useResponderReserva).
export function useCrearReserva(donacionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearReservaInput) => donacionesApi.reservar(donacionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donaciones', donacionId] });
    },
  });
}
