import { useQuery } from '@tanstack/react-query';
import { favoritosApi } from '../api/favoritos.api.js';

// Hook puro — trae la lista completa una sola vez (cacheada); los cards individuales derivan su
// propio estado "es favorito" contra esta misma lista (useEsFavorito), sin un GET por tarjeta.
export function useFavoritos() {
  return useQuery({
    queryKey: ['favoritos'],
    queryFn: () => favoritosApi.listar(),
    staleTime: 60 * 1000,
  });
}
