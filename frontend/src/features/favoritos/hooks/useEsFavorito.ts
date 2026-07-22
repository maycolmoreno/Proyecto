import { useFavoritos } from './useFavoritos.js';
import type { TipoEntidadFavorito } from '../types/index.js';

// Deriva la membresía del lado del cliente contra la lista ya cacheada por useFavoritos — evita un
// endpoint booleano por tarjeta.
export function useEsFavorito(tipoEntidad: TipoEntidadFavorito, entidadId: string | undefined): boolean {
  const favoritos = useFavoritos();
  if (!entidadId) return false;
  return (favoritos.data ?? []).some((f) => f.tipoEntidad === tipoEntidad && f.entidadId === entidadId);
}
