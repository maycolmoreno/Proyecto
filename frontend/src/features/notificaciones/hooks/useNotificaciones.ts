import { useQuery } from '@tanstack/react-query';
import { notificacionesApi } from '../api/notificaciones.api.js';

// Hook puro — polling ligero (30s) para reflejar notificaciones nuevas sin infraestructura de
// tiempo real (no hay WebSockets en este proyecto). `enabled` evita golpear el endpoint (exige
// authMiddleware) cuando no hay sesión activa.
export function useNotificaciones(enabled = true) {
  return useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => notificacionesApi.listar(),
    refetchInterval: 30000,
    enabled,
  });
}
