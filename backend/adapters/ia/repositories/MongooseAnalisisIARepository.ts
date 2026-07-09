import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import type { IAnalisisIARepository, AnalisisIA } from '@domain/ia/ports/IAnalisisIARepository.js';

const analisisIASchema = new Schema({
  tipo: { type: String, enum: ['CLASIFICACION', 'MODERACION'], required: true, index: true },
  tipoEntidad: { type: String, enum: ['DONACION', 'SOLICITUD', 'TRUEQUE'], required: true, index: true },
  entidadId: { type: String, required: true, index: true },
  prompt: { type: String, required: true },
  respuestaIA: { type: String, required: true },
  categoriaSugerida: { type: String, default: null },
  prioridad: { type: String, default: null },
  score: { type: Number, default: null },
  riesgoDetectado: { type: Boolean, default: null },
  categoriaRiesgo: { type: String, default: null },
  confianza: { type: Number, default: null },
  explicacion: { type: String, default: null },
  fecha: { type: Date, required: true, default: () => new Date(), index: true },
});

type AnalisisIADoc = InferSchemaType<typeof analisisIASchema>;

// Nombre de colección explícito — el modelo Mongoose por defecto pluraliza "analisis_ia" a
// "analisis_ias", distinto del nombre exacto documentado en Fase 3 sección 7.1.2.
const AnalisisIAModel = model<AnalisisIADoc>('AnalisisIA', analisisIASchema, 'analisis_ia');

function toDomain(doc: HydratedDocument<AnalisisIADoc>): AnalisisIA {
  return {
    tipo: doc.tipo as AnalisisIA['tipo'],
    tipoEntidad: doc.tipoEntidad as AnalisisIA['tipoEntidad'],
    entidadId: doc.entidadId,
    prompt: doc.prompt,
    respuestaIA: doc.respuestaIA,
    categoriaSugerida: doc.categoriaSugerida ?? null,
    prioridad: doc.prioridad ?? null,
    score: doc.score ?? null,
    riesgoDetectado: doc.riesgoDetectado ?? null,
    categoriaRiesgo: doc.categoriaRiesgo ?? null,
    confianza: doc.confianza ?? null,
    explicacion: doc.explicacion ?? null,
    fecha: doc.fecha,
  };
}

/** Adaptador de salida — implementa IAnalisisIARepository con Mongoose (Fase 3, MongoDB, `analisis_ia`). */
export class MongooseAnalisisIARepository implements IAnalisisIARepository {
  async registrar(input: AnalisisIA): Promise<void> {
    await AnalisisIAModel.create(input);
  }

  async listarConRiesgo(): Promise<AnalisisIA[]> {
    const docs = await AnalisisIAModel.find({ tipo: 'MODERACION', riesgoDetectado: true }).sort({ fecha: -1 });
    return docs.map(toDomain);
  }
}
