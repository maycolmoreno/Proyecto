import { Schema, model, type InferSchemaType } from 'mongoose';
import type {
  IEventoSistemaRepository,
  EventoSistemaInput,
  ConteoPorTipoEvento,
} from '@domain/notificaciones/ports/IEventoSistemaRepository.js';

const eventoSistemaSchema = new Schema({
  usuarioId: { type: String, default: null, index: true },
  tipoEvento: { type: String, required: true, index: true },
  entidad: { type: String, required: true },
  referenciaId: { type: String, required: true },
  metadatos: { type: Schema.Types.Mixed, default: {} },
  fecha: { type: Date, required: true, default: () => new Date() },
});

type EventoSistemaDoc = InferSchemaType<typeof eventoSistemaSchema>;

// Fase 3, sección 7 — TTL de 90 días (ADR-014). Los conteos acumulados que alimentan el dashboard
// se leen antes de esa ventana; para historia de largo plazo se usarían las tablas Postgres, que no expiran.
eventoSistemaSchema.index({ fecha: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Nombre de colección explícito — el modelo Mongoose por defecto pluraliza "eventos_sistema" a
// "eventos_sistemas", distinto del nombre exacto documentado en Fase 3 sección 7.1.2.
const EventoSistemaModel = model<EventoSistemaDoc>('EventoSistema', eventoSistemaSchema, 'eventos_sistema');

/** Adaptador de salida — implementa IEventoSistemaRepository con Mongoose. */
export class MongooseEventoSistemaRepository implements IEventoSistemaRepository {
  async registrar(input: EventoSistemaInput): Promise<void> {
    await EventoSistemaModel.create(input);
  }

  async contarPorTipoEvento(tipos: string[]): Promise<ConteoPorTipoEvento[]> {
    const resultados = await EventoSistemaModel.aggregate<{ _id: string; total: number }>([
      { $match: { tipoEvento: { $in: tipos } } },
      { $group: { _id: '$tipoEvento', total: { $sum: 1 } } },
    ]);
    return resultados.map((r) => ({ tipoEvento: r._id, total: r.total }));
  }
}
