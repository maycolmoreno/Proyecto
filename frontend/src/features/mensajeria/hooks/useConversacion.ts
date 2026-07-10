import { useQuery } from '@tanstack/react-query';
import { mensajeriaApi } from '../api/mensajeria.api.js';

// Hook puro — mensajes con un participante específico. `null` es un resultado válido (aún no hay
// conversación, no un error) — el backend responde 404, ya traducido por mensajeria.api.ts.
// Polling corto (5s) mientras el hilo está abierto — sin esto, el mensaje del otro participante
// nunca aparece hasta recargar la página (no hay WebSockets en el proyecto, mismo criterio que
// useNotificaciones, pero más frecuente porque un chat activo necesita sentirse más inmediato).
export function useConversacion(otroParticipanteId: string | undefined) {
  return useQuery({
    queryKey: ['conversaciones', otroParticipanteId],
    queryFn: () => mensajeriaApi.listarMensajes(otroParticipanteId!),
    enabled: Boolean(otroParticipanteId),
    refetchInterval: 5000,
  });
}
