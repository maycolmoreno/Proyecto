import { useDonaciones } from '@features/donaciones/hooks/useDonaciones';
import { useSesion } from '@features/identidad/hooks/useSesion';
import type { Donacion } from '@features/donaciones/types/index.js';

// Extraído de SolicitudDetallePage (Fase 5 sección 2.5) — mis donaciones PUBLICADA de una
// categoría, candidatas para ofrecer sobre una Solicitud. El filtro por "es mía" se hace
// client-side porque GET /donaciones no soporta `donanteId=me` (la API no lo expone).
// Reutilizado por SolicitudDetallePage y por OfertarRapido (acción rápida desde el listado).
export function useMisDonacionesDisponibles(categoriaId: string | undefined): {
  data: Donacion[];
  isLoading: boolean;
} {
  const sesion = useSesion();
  const misDonaciones = useDonaciones({ categoriaId, estado: 'PUBLICADA', limit: 50 });

  const data = (misDonaciones.data?.data ?? []).filter((d) => d.donanteId === sesion.data?.id);

  return { data, isLoading: misDonaciones.isLoading };
}
