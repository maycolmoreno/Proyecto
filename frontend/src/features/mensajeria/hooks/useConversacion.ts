import { useQuery } from '@tanstack/react-query';
import { mensajeriaApi } from '../api/mensajeria.api.js';

// Hook puro — mensajes con un participante específico. `null` es un resultado válido (aún no hay
// conversación, no un error) — el backend responde 404, ya traducido por mensajeria.api.ts.
export function useConversacion(otroParticipanteId: string | undefined) {
  return useQuery({
    queryKey: ['conversaciones', otroParticipanteId],
    queryFn: () => mensajeriaApi.listarMensajes(otroParticipanteId!),
    enabled: Boolean(otroParticipanteId),
  });
}
