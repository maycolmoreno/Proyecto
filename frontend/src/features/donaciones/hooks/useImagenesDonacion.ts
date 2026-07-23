import { useQueryClient } from '@tanstack/react-query';
import { donacionesApi } from '../api/donaciones.api.js';

// Hook puro — expone firmar/registrar en la forma que espera el ImageUploader compartido
// (Fase 4, sección 5; ADR-009). Invalida el prefijo ['donaciones'] completo, no solo el detalle:
// con la clave exacta ['donaciones', donacionId] el listado (['donaciones', filtros]) se quedaba
// con la foto vieja en caché hasta que algo más lo invalidara — bug real reportado por el usuario
// ("subo una foto y la tarjeta sigue mostrando el cartón") 2026-07-23.
export function useImagenesDonacion(donacionId: string) {
  const queryClient = useQueryClient();

  return {
    firmar: (mimeType: string, tamanoBytes: number) => donacionesApi.firmarImagen(donacionId, mimeType, tamanoBytes),
    registrar: async (url: string, publicId: string) => {
      await donacionesApi.registrarImagen(donacionId, url, publicId);
      await queryClient.invalidateQueries({ queryKey: ['donaciones'] });
    },
  };
}
