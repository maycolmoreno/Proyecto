import { httpClient } from '@shared/lib/http-client';
import type { Favorito, TipoEntidadFavorito } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1).
export const favoritosApi = {
  listar: () => httpClient.get<Favorito[]>('/favoritos'),
  agregar: (tipoEntidad: TipoEntidadFavorito, entidadId: string) =>
    httpClient.post<void>('/favoritos', { tipoEntidad, entidadId }),
  quitar: (tipoEntidad: TipoEntidadFavorito, entidadId: string) =>
    httpClient.delete<void>(`/favoritos/${tipoEntidad}/${entidadId}`),
};
