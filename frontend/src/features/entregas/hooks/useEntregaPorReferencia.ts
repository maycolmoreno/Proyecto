import { useQuery } from '@tanstack/react-query';
import { entregasApi } from '../api/entregas.api.js';

// Hook puro — descubre la Entrega asociada a una Donación/Trueque (idReferencia). Devuelve
// `data: null` si todavía no existe (aún no hay oferta/propuesta aceptada), no un error.
export function useEntregaPorReferencia(idReferencia: string | undefined) {
  return useQuery({
    queryKey: ['entregas', 'por-referencia', idReferencia],
    queryFn: () => entregasApi.obtenerPorReferencia(idReferencia!),
    enabled: Boolean(idReferencia),
  });
}
