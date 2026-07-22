import { useMutation, useQueryClient } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';

// Hook puro — el donante acepta o rechaza una reserva recibida. Aceptar auto-rechaza las demás
// pendientes (regla de negocio en el backend); ambas mutaciones invalidan el mismo detalle.
export function useResponderReserva(donacionId: string) {
  const queryClient = useQueryClient();

  const invalidar = (): void => {
    queryClient.invalidateQueries({ queryKey: ['donaciones', donacionId] });
  };

  const aceptar = useMutation({
    mutationFn: (reservaId: string) => donacionesApi.aceptarReserva(donacionId, reservaId),
    onSuccess: invalidar,
  });

  const rechazar = useMutation({
    mutationFn: (reservaId: string) => donacionesApi.rechazarReserva(donacionId, reservaId),
    onSuccess: invalidar,
  });

  return { aceptar, rechazar };
}
