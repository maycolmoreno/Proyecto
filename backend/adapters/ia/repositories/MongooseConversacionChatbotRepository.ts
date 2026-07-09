import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import type {
  IConversacionChatbotRepository,
  ConversacionChatbotProps,
  CrearConversacionInput,
} from '@domain/ia/ports/IConversacionChatbotRepository.js';

const mensajeSchema = new Schema(
  {
    rol: { type: String, enum: ['usuario', 'bot'], required: true },
    texto: { type: String, required: true },
    timestamp: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const sesionSchema = new Schema(
  {
    sesionId: { type: String, required: true },
    iniciadoEn: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const conversacionChatbotSchema = new Schema({
  usuarioId: { type: String, required: true, index: true },
  sesiones: { type: [sesionSchema], default: [] },
  mensajes: { type: [mensajeSchema], default: [] },
  canal: { type: String, required: true, default: 'web' },
  fecha: { type: Date, required: true, default: () => new Date(), index: true },
});

type ConversacionChatbotDoc = InferSchemaType<typeof conversacionChatbotSchema>;

const ConversacionChatbotModel = model<ConversacionChatbotDoc>('chatbot_conversaciones', conversacionChatbotSchema);

function toDomain(doc: HydratedDocument<ConversacionChatbotDoc>): ConversacionChatbotProps {
  return {
    id: doc._id.toString(),
    usuarioId: doc.usuarioId,
    sesiones: doc.sesiones.map((s) => ({ sesionId: s.sesionId, iniciadoEn: s.iniciadoEn })),
    mensajes: doc.mensajes.map((m) => ({ rol: m.rol, texto: m.texto, timestamp: m.timestamp })),
    canal: doc.canal,
    fecha: doc.fecha,
  };
}

/** Adaptador de salida — implementa IConversacionChatbotRepository con Mongoose (Fase 3, MongoDB). */
export class MongooseConversacionChatbotRepository implements IConversacionChatbotRepository {
  async crear(input: CrearConversacionInput): Promise<ConversacionChatbotProps> {
    const doc = await ConversacionChatbotModel.create({
      usuarioId: input.usuarioId,
      canal: input.canal,
      sesiones: [],
      mensajes: [],
      fecha: new Date(),
    });
    return toDomain(doc);
  }

  async actualizar(conversacion: ConversacionChatbotProps): Promise<void> {
    await ConversacionChatbotModel.updateOne(
      { _id: conversacion.id },
      {
        $set: {
          sesiones: conversacion.sesiones,
          mensajes: conversacion.mensajes,
        },
      },
    );
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<ConversacionChatbotProps | null> {
    const doc = await ConversacionChatbotModel.findOne({ usuarioId });
    return doc ? toDomain(doc) : null;
  }

  async buscarPorId(id: string): Promise<ConversacionChatbotProps | null> {
    const doc = await ConversacionChatbotModel.findById(id).catch(() => null);
    return doc ? toDomain(doc) : null;
  }
}
