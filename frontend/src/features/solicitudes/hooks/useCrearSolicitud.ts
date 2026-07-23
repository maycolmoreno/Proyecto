import { useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudesApi } from '../api/solicitudes.api.js';
import type { CrearSolicitudInput } from '../types/index.js';

// Hook puro (RF-008/CU-005). También invalida ['publicaciones', 'mias'] (Mis publicaciones,
// "Resumen" del listado, stats del detalle) — sin esto se quedaba con el conteo de antes de
// publicar hasta un reload completo (bug real reportado por el usuario) 2026-07-23.
export function useCrearSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CrearSolicitudInput) => solicitudesApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['publicaciones', 'mias'] });
    },
  });
}
