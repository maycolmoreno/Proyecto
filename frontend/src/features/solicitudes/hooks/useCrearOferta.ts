import { useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudesApi } from '../api/solicitudes.api.js';
import type { CrearOfertaInput } from '../types/index.js';

// Hook puro (RF-009/CU-006) — un solo paso: la oferta nace ACEPTADA y crea la Entrega en el
// backend (EntregaCoordinacionService, síncrono). Invalida el detalle de la solicitud.
export function useCrearOferta(solicitudId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearOfertaInput) => solicitudesApi.crearOferta(solicitudId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes', solicitudId] });
    },
  });
}
