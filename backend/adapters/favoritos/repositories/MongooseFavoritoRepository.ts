import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import type {
  IFavoritoRepository,
  Favorito,
  AgregarFavoritoInput,
  TipoEntidadFavorito,
} from '@domain/favoritos/ports/IFavoritoRepository.js';

const favoritoSchema = new Schema({
  usuarioId: { type: String, required: true, index: true },
  tipoEntidad: { type: String, required: true },
  entidadId: { type: String, required: true },
  titulo: { type: String, required: true },
  imagenUrl: { type: String, default: null },
  fecha: { type: Date, required: true, default: () => new Date() },
});
// Idempotencia: guardar el mismo favorito dos veces no debe duplicar ni fallar (ver `agregar`,
// que usa upsert sobre esta misma clave).
favoritoSchema.index({ usuarioId: 1, tipoEntidad: 1, entidadId: 1 }, { unique: true });

type FavoritoDoc = InferSchemaType<typeof favoritoSchema>;

// Nombre de colección explícito ('favoritos') — mismo gotcha que notificaciones/eventos_sistema:
// Mongoose pluralizaría mal si se deja que lo infiera del nombre del modelo.
const FavoritoModel = model<FavoritoDoc>('Favorito', favoritoSchema, 'favoritos');

function toDomain(doc: HydratedDocument<FavoritoDoc>): Favorito {
  return {
    id: doc._id.toString(),
    usuarioId: doc.usuarioId,
    tipoEntidad: doc.tipoEntidad as TipoEntidadFavorito,
    entidadId: doc.entidadId,
    titulo: doc.titulo,
    imagenUrl: doc.imagenUrl ?? null,
    fecha: doc.fecha,
  };
}

/** Adaptador de salida — implementa IFavoritoRepository con Mongoose. A diferencia de
 * MongooseNotificacionRepository/MongoosePublicacionIndexRepository, las escrituras NO se envuelven
 * en `.catch(() => undefined)`: acá no hay una fuente de verdad de respaldo en Postgres, así que un
 * error real debe propagarse (500) en vez de perderse en silencio. */
export class MongooseFavoritoRepository implements IFavoritoRepository {
  async agregar(input: AgregarFavoritoInput): Promise<void> {
    await FavoritoModel.updateOne(
      { usuarioId: input.usuarioId, tipoEntidad: input.tipoEntidad, entidadId: input.entidadId },
      { $setOnInsert: { ...input, fecha: new Date() } },
      { upsert: true },
    );
  }

  async quitar(usuarioId: string, tipoEntidad: TipoEntidadFavorito, entidadId: string): Promise<void> {
    await FavoritoModel.deleteOne({ usuarioId, tipoEntidad, entidadId });
  }

  async listarPorUsuario(usuarioId: string): Promise<Favorito[]> {
    const docs = await FavoritoModel.find({ usuarioId }).sort({ fecha: -1 });
    return docs.map(toDomain);
  }
}
