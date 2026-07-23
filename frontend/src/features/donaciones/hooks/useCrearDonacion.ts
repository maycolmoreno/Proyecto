import { useMutation, useQueryClient } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';
import type { CrearDonacionInput } from '../types/index.js';

// Hook puro (RF-005/CU-003): al publicar, invalida el listado para que aparezca de inmediato.
// También invalida ['publicaciones', 'mias'] — mismo bug real de useCrearSolicitud, reportado por
// el usuario 2026-07-23 (el "Resumen" de Solicitudes se quedaba pegado en el conteo viejo).
export function useCrearDonacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearDonacionInput) => donacionesApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donaciones'] });
      queryClient.invalidateQueries({ queryKey: ['publicaciones', 'mias'] });
    },
  });
}
