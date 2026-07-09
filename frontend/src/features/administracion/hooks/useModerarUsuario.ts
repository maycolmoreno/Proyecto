import { useMutation, useQueryClient } from '@tanstack/react-query';
import { administracionApi } from '../api/administracion.api.js';
import type { AccionModeracion } from '../types/index.js';

// Hook puro (RF-018/CU-011) — Aprobar activa, Bloquear suspende, Eliminar marca ELIMINADO (terminal).
export function useModerarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, accion }: { id: string; accion: AccionModeracion }) =>
      administracionApi.moderarUsuario(id, accion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });
}
