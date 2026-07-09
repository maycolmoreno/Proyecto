import { useQuery } from '@tanstack/react-query';
import { mensajeriaApi } from '../api/mensajeria.api.js';

// Hook puro — lista las conversaciones propias (Fase 4, sección 3).
export function useConversaciones() {
  return useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => mensajeriaApi.listarConversaciones(),
  });
}
