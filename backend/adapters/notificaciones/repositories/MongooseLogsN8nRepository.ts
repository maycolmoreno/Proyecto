import { Schema, model, type InferSchemaType } from 'mongoose';
import type { ILogsN8nRepository, LogN8nInput } from '@domain/notificaciones/ports/ILogsN8nRepository.js';

const logsN8nSchema = new Schema({
  workflowId: { type: String, required: true },
  evento: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed, required: true },
  resultado: { type: String, required: true },
  estado: { type: String, enum: ['EXITOSO', 'FALLIDO'], required: true },
  fecha: { type: Date, required: true, default: () => new Date() },
});

type LogsN8nDoc = InferSchemaType<typeof logsN8nSchema>;

// Fase 3, sección 7 — TTL de 90 días para logs operativos de corta vida útil (ADR-014).
logsN8nSchema.index({ fecha: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Nombre de colección explícito — el modelo Mongoose por defecto pluraliza "logs_n8n" a
// "logs_n8ns", distinto del nombre exacto documentado en Fase 3 sección 7.1.2.
const LogsN8nModel = model<LogsN8nDoc>('LogsN8n', logsN8nSchema, 'logs_n8n');

/** Adaptador de salida — implementa ILogsN8nRepository con Mongoose. */
export class MongooseLogsN8nRepository implements ILogsN8nRepository {
  async registrar(input: LogN8nInput): Promise<void> {
    await LogsN8nModel.create(input);
  }
}
