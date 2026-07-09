import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import type {
  INotificacionRepository,
  Notificacion,
  CrearNotificacionInput,
} from '@domain/notificaciones/ports/INotificacionRepository.js';

const notificacionSchema = new Schema({
  usuarioId: { type: String, required: true, index: true },
  tipo: { type: String, required: true },
  entidadRelacionada: { type: String, default: null },
  mensaje: { type: String, required: true },
  leido: { type: Boolean, required: true, default: false },
  canal: { type: String, required: true, default: 'app' },
  fecha: { type: Date, required: true, default: () => new Date(), index: true },
});

type NotificacionDoc = InferSchemaType<typeof notificacionSchema>;

const NotificacionModel = model<NotificacionDoc>('notificaciones', notificacionSchema);

function toDomain(doc: HydratedDocument<NotificacionDoc>): Notificacion {
  return {
    id: doc._id.toString(),
    usuarioId: doc.usuarioId,
    tipo: doc.tipo,
    entidadRelacionada: doc.entidadRelacionada ?? null,
    mensaje: doc.mensaje,
    leido: doc.leido,
    canal: doc.canal,
    fecha: doc.fecha,
  };
}

/** Adaptador de salida — implementa INotificacionRepository con Mongoose. */
export class MongooseNotificacionRepository implements INotificacionRepository {
  async crear(input: CrearNotificacionInput): Promise<void> {
    await NotificacionModel.create(input);
  }

  async listarPorUsuario(usuarioId: string): Promise<Notificacion[]> {
    const docs = await NotificacionModel.find({ usuarioId }).sort({ fecha: -1 });
    return docs.map(toDomain);
  }

  async marcarLeido(id: string, usuarioId: string): Promise<boolean> {
    const resultado = await NotificacionModel.updateOne({ _id: id, usuarioId }, { $set: { leido: true } }).catch(
      () => null,
    );
    return !!resultado && resultado.matchedCount > 0;
  }
}
