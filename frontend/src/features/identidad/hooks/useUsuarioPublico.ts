import { useQuery } from '@tanstack/react-query';
import { usuariosApi } from '../api/usuarios.api.js';

// Hook puro — resuelve el nombre de otro usuario (Sprint F5: mensajería, "enviar mensaje al
// publicador"). Cacheado por id, no cambia con frecuencia.
export function useUsuarioPublico(id: string | undefined) {
  return useQuery({
    queryKey: ['usuarios', id],
    queryFn: () => usuariosApi.obtenerPorId(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
