import { useQueryClient } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';

// Hook puro — expone firmar/registrar en la forma que espera el ImageUploader compartido
// (Fase 4, sección 5; ADR-009), invalidando el detalle tras registrar una imagen nueva.
export function useImagenesDonacion(donacionId: string) {
  const queryClient = useQueryClient();

  return {
    firmar: (mimeType: string, tamanoBytes: number) => donacionesApi.firmarImagen(donacionId, mimeType, tamanoBytes),
    registrar: async (url: string, publicId: string) => {
      await donacionesApi.registrarImagen(donacionId, url, publicId);
      await queryClient.invalidateQueries({ queryKey: ['donaciones', donacionId] });
    },
  };
}
