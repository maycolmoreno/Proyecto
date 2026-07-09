import { useQueryClient } from '@tanstack/react-query';
import { truequesApi } from '../api/trueques.api.js';

// Hook puro — expone firmar/registrar en la forma que espera el ImageUploader compartido
// (Fase 4, sección 5; ADR-009), invalidando el detalle tras registrar una imagen nueva.
export function useImagenesTrueque(truequeId: string) {
  const queryClient = useQueryClient();

  return {
    firmar: (mimeType: string, tamanoBytes: number) => truequesApi.firmarImagen(truequeId, mimeType, tamanoBytes),
    registrar: async (url: string, publicId: string) => {
      await truequesApi.registrarImagen(truequeId, url, publicId);
      await queryClient.invalidateQueries({ queryKey: ['trueques', truequeId] });
    },
  };
}
