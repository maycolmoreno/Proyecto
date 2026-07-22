import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritosApi } from '../api/favoritos.api.js';
import type { TipoEntidadFavorito } from '../types/index.js';

interface ToggleFavoritoInput {
  tipoEntidad: TipoEntidadFavorito;
  entidadId: string;
  esFavorito: boolean;
}

// Hook puro — un solo mutation para agregar/quitar (el llamador decide según el estado actual,
// resuelto por useEsFavorito).
export function useToggleFavorito() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipoEntidad, entidadId, esFavorito }: ToggleFavoritoInput) =>
      esFavorito ? favoritosApi.quitar(tipoEntidad, entidadId) : favoritosApi.agregar(tipoEntidad, entidadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
    },
  });
}
