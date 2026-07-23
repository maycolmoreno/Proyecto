import { useQueryClient } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';

// Hook puro — expone firmar/registrar en la forma que espera el ImageUploader compartido
// (Fase 4, sección 5; ADR-009). Invalida el prefijo ['trueques'] completo, no solo el detalle:
// con la clave exacta ['trueques', truequeId] el listado (['trueques', filtros]) se quedaba con
// la foto vieja en caché — mismo bug real de useImagenesDonacion, reportado por el usuario 2026-07-23.
export function useImagenesTrueque(truequeId: string) {
  const queryClient = useQueryClient();

  return {
    firmar: (mimeType: string, tamanoBytes: number) => truequesApi.firmarImagen(truequeId, mimeType, tamanoBytes),
    registrar: async (url: string, publicId: string) => {
      await truequesApi.registrarImagen(truequeId, url, publicId);
      await queryClient.invalidateQueries({ queryKey: ['trueques'] });
    },
  };
}
