// Tipos del dominio de Favoritos — espejo del DTO del backend (IFavoritoRepository).
export type TipoEntidadFavorito = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

export interface Favorito {
  id: string;
  tipoEntidad: TipoEntidadFavorito;
  entidadId: string;
  titulo: string;
  imagenUrl: string | null;
  fecha: string;
}
