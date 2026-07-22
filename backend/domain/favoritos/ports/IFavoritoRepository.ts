// Tipo local (no se reutiliza TipoEntidadIA/TipoPublicacion) — el codebase ya declara esta misma
// unión de 3 valores independientemente por módulo (ver TipoEntidadIA en domain/ia, TipoPublicacion
// en domain/publicaciones); esa es la convención establecida, no centralizarla.
export type TipoEntidadFavorito = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

export interface Favorito {
  id: string;
  usuarioId: string;
  tipoEntidad: TipoEntidadFavorito;
  entidadId: string;
  titulo: string;
  imagenUrl: string | null;
  fecha: Date;
}

export interface AgregarFavoritoInput {
  usuarioId: string;
  tipoEntidad: TipoEntidadFavorito;
  entidadId: string;
  titulo: string;
  imagenUrl: string | null;
}

/** Puerto de salida — MongoDB (`favoritos`). A diferencia de PublicacionIndexService/Notificaciones
 * (proyecciones best-effort con Postgres como fuente de verdad real), acá Mongo ES la única fuente
 * de verdad: no hay ningún otro lugar donde recomputar "qué guardó este usuario" si la escritura
 * falla — por eso el adapter NO silencia errores de escritura (ver MongooseFavoritoRepository). */
export interface IFavoritoRepository {
  /** Idempotente — agregar dos veces el mismo favorito no duplica ni falla. */
  agregar(input: AgregarFavoritoInput): Promise<void>;
  quitar(usuarioId: string, tipoEntidad: TipoEntidadFavorito, entidadId: string): Promise<void>;
  listarPorUsuario(usuarioId: string): Promise<Favorito[]>;
}
