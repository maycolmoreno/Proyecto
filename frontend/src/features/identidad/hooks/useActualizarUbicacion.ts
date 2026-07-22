import { useMutation, useQueryClient } from '@tanstack/react-query';
import { identidadApi } from '../api/identidad.api.js';
import type { UbicacionInput } from '@shared/lib/ubicacion';

// PATCH /usuarios/me/ubicacion — guarda o actualiza (upsert) la ubicación de perfil. Mismo molde
// que useActualizarPerfiles: invalida ['sesion'] para que useSesion() refresque en toda la app.
export function useActualizarUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UbicacionInput) => identidadApi.actualizarUbicacion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesion'] });
    },
  });
}
