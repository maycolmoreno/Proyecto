import { useMutation, useQueryClient } from '@tanstack/react-query';
import { identidadApi } from '../api/identidad.api.js';
import type { ActualizarPerfilesInput } from '../types/index.js';

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — PATCH /usuarios/me/perfiles (activar/desactivar).
export function useActualizarPerfiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ActualizarPerfilesInput) => identidadApi.actualizarPerfiles(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesion'] });
    },
  });
}
