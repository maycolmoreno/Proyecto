import { useMutation, useQueryClient } from '@tanstack/react-query';
import { administracionApi } from '../api/administracion.api.js';
import type { AccionModeracion, TipoEntidadModeracion } from '../types/index.js';

const QUERY_KEY_POR_TIPO: Record<TipoEntidadModeracion, string> = {
  DONACION: 'donaciones',
  SOLICITUD: 'solicitudes',
  TRUEQUE: 'trueques',
};

// Hook puro (RF-018/CU-011) — Bloquear/Eliminar cancelan la publicación (mismo estado terminal que
// cancelar(), Fase 4 sección 6: no hay un estado BLOQUEADA independiente); Aprobar solo audita.
export function useModerarPublicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, id, accion }: { tipo: TipoEntidadModeracion; id: string; accion: AccionModeracion }) =>
      administracionApi.moderarPublicacion(tipo, id, accion),
    onSuccess: (_, { tipo, id }) => {
      const clave = QUERY_KEY_POR_TIPO[tipo];
      queryClient.invalidateQueries({ queryKey: [clave] });
      queryClient.invalidateQueries({ queryKey: [clave, id] });
    },
  });
}
