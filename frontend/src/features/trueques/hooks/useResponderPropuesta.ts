import { useMutation, useQueryClient } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';

// Hook puro (RF-013) — el dueño del trueque origen acepta o rechaza una propuesta recibida.
// Aceptar auto-rechaza las demás pendientes (regla de negocio en el backend); ambas mutaciones
// invalidan el mismo detalle.
export function useResponderPropuesta(truequeOrigenId: string) {
  const queryClient = useQueryClient();

  const invalidar = (): void => {
    queryClient.invalidateQueries({ queryKey: ['trueques', truequeOrigenId] });
  };

  const aceptar = useMutation({
    mutationFn: (propuestaId: string) => truequesApi.aceptarPropuesta(truequeOrigenId, propuestaId),
    onSuccess: invalidar,
  });

  const rechazar = useMutation({
    mutationFn: (propuestaId: string) => truequesApi.rechazarPropuesta(truequeOrigenId, propuestaId),
    onSuccess: invalidar,
  });

  return { aceptar, rechazar };
}
