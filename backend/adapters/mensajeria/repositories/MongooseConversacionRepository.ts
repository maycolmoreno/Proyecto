import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { Conversacion } from '@domain/mensajeria/entities/Conversacion.js';
import type { IConversacionRepository } from '@domain/mensajeria/ports/IConversacionRepository.js';

const mensajeSchema = new Schema(
  {
    autorId: { type: String, required: true },
    texto: { type: String, required: true },
    fecha: { type: Date, required: true, default: () => new Date() },
    leido: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const conversacionSchema = new Schema({
  _id: { type: String, required: true },
  participantes: { type: [String], required: true, index: true },
  entregaIdReferencia: { type: String, default: null },
  mensajes: { type: [mensajeSchema], default: [] },
  fecha: { type: Date, required: true, default: () => new Date() },
});

type ConversacionDoc = InferSchemaType<typeof conversacionSchema>;

// Fase 3, sección 7.1.2 — colección `mensajes`: cada documento es una conversación completa.
const ConversacionModel = model<ConversacionDoc>('mensajes', conversacionSchema);

function toDomain(doc: HydratedDocument<ConversacionDoc>): Conversacion {
  return Conversacion.reconstituir({
    id: doc._id,
    participantes: doc.participantes as [string, string],
    entregaIdReferencia: doc.entregaIdReferencia ?? null,
    mensajes: doc.mensajes.map((m) => ({ autorId: m.autorId, texto: m.texto, fecha: m.fecha, leido: m.leido })),
    fecha: doc.fecha,
  });
}

/** Adaptador de salida — implementa IConversacionRepository con Mongoose. */
export class MongooseConversacionRepository implements IConversacionRepository {
  async crear(conversacion: Conversacion): Promise<void> {
    await ConversacionModel.create({
      _id: conversacion.id,
      participantes: conversacion.participantes,
      entregaIdReferencia: conversacion.entregaIdReferencia,
      mensajes: conversacion.mensajes,
      fecha: conversacion.fecha,
    });
  }

  async actualizar(conversacion: Conversacion): Promise<void> {
    await ConversacionModel.updateOne({ _id: conversacion.id }, { $set: { mensajes: conversacion.mensajes } });
  }

  async buscarPorId(id: string): Promise<Conversacion | null> {
    const doc = await ConversacionModel.findById(id);
    return doc ? toDomain(doc) : null;
  }

  async buscarPorParticipantes(usuarioIdA: string, usuarioIdB: string): Promise<Conversacion | null> {
    const doc = await ConversacionModel.findOne({ participantes: { $all: [usuarioIdA, usuarioIdB] } });
    return doc ? toDomain(doc) : null;
  }

  async listarPorParticipante(usuarioId: string): Promise<Conversacion[]> {
    const docs = await ConversacionModel.find({ participantes: usuarioId }).sort({ fecha: -1 });
    return docs.map(toDomain);
  }
}
