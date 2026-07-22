// Proyección de solo lectura (Fase 5 diferida, docs/DISENO_MODELO_PERFILES.md sección 7) — feed
// unificado "Mis publicaciones" sobre Donaciones/Solicitudes/Trueques, poblado vía Event Bus.
// No participa de ninguna máquina de estado: los 3 aggregates de Postgres siguen siendo la fuente
// de verdad; esta colección solo denormaliza para lectura rápida por dueño.
export type TipoPublicacion = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

export interface PublicacionIndexEntry {
  id: string;
  tipo: TipoPublicacion;
  titulo: string;
  estado: string;
  usuarioId: string;
  fecha: Date;
  actualizadoEn: Date;
}

export interface IndexarPublicacionInput {
  id: string;
  tipo: TipoPublicacion;
  titulo: string;
  estado: string;
  usuarioId: string;
}

/** Puerto de salida — MongoDB (`publicaciones_index`). Implementado en
 * adapters/publicaciones/repositories/MongoosePublicacionIndexRepository. */
export interface IPublicacionIndexRepository {
  indexar(input: IndexarPublicacionInput): Promise<void>;
  /** No-op si `id`+`tipo` no calzan con ninguna fila indexada (evento fuera de orden o publicación
   * anterior a que este listener existiera) — nunca lanza. */
  actualizarEstado(id: string, tipo: TipoPublicacion, estado: string): Promise<void>;
  listarPorUsuario(usuarioId: string): Promise<PublicacionIndexEntry[]>;
}
