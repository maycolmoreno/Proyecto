import { useQuery, useQueryClient } from '@tanstack/react-query';
import { identidadApi } from '../api/identidad.api.js';
import { limpiarToken, obtenerToken } from '@shared/lib/http-client';

// Hook puro: estado de sesión derivado del servidor (TanStack Query, ADR-043) — sin store global.
export function useSesion() {
  const tieneToken = Boolean(obtenerToken());

  return useQuery({
    queryKey: ['sesion'],
    queryFn: () => identidadApi.me(),
    enabled: tieneToken,
    retry: false,
  });
}

export function useCerrarSesion() {
  const queryClient = useQueryClient();

  return () => {
    limpiarToken();
    queryClient.removeQueries({ queryKey: ['sesion'] });
  };
}
