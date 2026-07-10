import { useQuery } from '@tanstack/react-query';
import { mensajeriaApi } from '../api/mensajeria.api.js';

// Hook puro — lista las conversaciones propias (Fase 4, sección 3). Polling ligero (15s) para que
// aparezcan conversaciones/mensajes nuevos sin recargar (sin WebSockets en el proyecto).
export function useConversaciones() {
  return useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => mensajeriaApi.listarConversaciones(),
    refetchInterval: 15000,
  });
}
