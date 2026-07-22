import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import type {
  IPublicacionIndexRepository,
  IndexarPublicacionInput,
  PublicacionIndexEntry,
  TipoPublicacion,
} from '@domain/publicaciones/ports/IPublicacionIndexRepository.js';

const publicacionIndexSchema = new Schema({
  // id de la Donación/Solicitud/Trueque en Postgres — no un id propio del documento.
  id: { type: String, required: true, unique: true },
  tipo: { type: String, required: true },
  titulo: { type: String, required: true },
  estado: { type: String, required: true },
  usuarioId: { type: String, required: true, index: true },
  fecha: { type: Date, required: true, default: () => new Date() },
  actualizadoEn: { type: Date, required: true, default: () => new Date() },
});

type PublicacionIndexDoc = InferSchemaType<typeof publicacionIndexSchema>;

// Nombre de colección explícito — Mongoose pluralizaría "publicaciones_index" a
// "publicaciones_indices" por defecto (mismo gotcha que eventos_sistema).
const PublicacionIndexModel = model<PublicacionIndexDoc>(
  'PublicacionIndex',
  publicacionIndexSchema,
  'publicaciones_index',
);

function toDomain(doc: HydratedDocument<PublicacionIndexDoc>): PublicacionIndexEntry {
  return {
    id: doc.id,
    tipo: doc.tipo as TipoPublicacion,
    titulo: doc.titulo,
    estado: doc.estado,
    usuarioId: doc.usuarioId,
    fecha: doc.fecha,
    actualizadoEn: doc.actualizadoEn,
  };
}

/** Adaptador de salida — implementa IPublicacionIndexRepository con Mongoose. Esta proyección
 * nunca debe romper el flujo de publicar: errores de escritura se atrapan y no se relanzan, mismo
 * criterio que NotificacionDispatchService. */
export class MongoosePublicacionIndexRepository implements IPublicacionIndexRepository {
  async indexar(input: IndexarPublicacionInput): Promise<void> {
    await PublicacionIndexModel.create({ ...input, actualizadoEn: new Date() }).catch(() => undefined);
  }

  async actualizarEstado(id: string, tipo: TipoPublicacion, estado: string): Promise<void> {
    await PublicacionIndexModel.updateOne({ id, tipo }, { $set: { estado, actualizadoEn: new Date() } }).catch(
      () => undefined,
    );
  }

  async listarPorUsuario(usuarioId: string): Promise<PublicacionIndexEntry[]> {
    // Sin TTL (a diferencia de eventos_sistema, esta proyección debe persistir) — el límite es una
    // salvaguarda barata contra un usuario muy activo, ver docs/DISENO_MODELO_PERFILES.md sección 7.
    const docs = await PublicacionIndexModel.find({ usuarioId }).sort({ fecha: -1 }).limit(200);
    return docs.map(toDomain);
  }
}
