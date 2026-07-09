import type { IIAProvider, MensajeChat } from '../ports/IIAProvider.js';
import type { IConversacionChatbotRepository, ConversacionChatbotProps } from '../ports/IConversacionChatbotRepository.js';

export interface ChatearInput {
  usuarioId: string;
  texto: string;
  sesionId?: string;
}

export interface ChatearResultado {
  conversacionId: string;
  respuesta: string;
}

export class ConversacionNoEncontradaError extends Error {
  constructor() {
    super('Conversación no encontrada.');
    this.name = 'ConversacionNoEncontradaError';
  }
}

export class NoEsDueñoDeLaConversacionError extends Error {
  constructor() {
    super('No tienes permiso para ver esta conversación.');
    this.name = 'NoEsDueñoDeLaConversacionError';
  }
}

/** Domain Service (Fase 2, sección 6) — CU-009/RF-014. Un documento Mongo por usuario
 * (ver docs/fases/fase-06-backend.md historial, Sprint 4). */
export class ChatbotOrquestacionService {
  constructor(
    private readonly iaProvider: IIAProvider,
    private readonly conversacionRepository: IConversacionChatbotRepository,
  ) {}

  async chatear(input: ChatearInput): Promise<ChatearResultado> {
    let conversacion = await this.conversacionRepository.buscarPorUsuarioId(input.usuarioId);
    if (!conversacion) {
      conversacion = await this.conversacionRepository.crear({ usuarioId: input.usuarioId, canal: 'web' });
    }

    if (input.sesionId && !conversacion.sesiones.some((s) => s.sesionId === input.sesionId)) {
      conversacion.sesiones.push({ sesionId: input.sesionId, iniciadoEn: new Date() });
    }

    // Historial acotado a los últimos 15 mensajes previos (RNF-002, Fase 7 sección 2) — antes de
    // agregar el mensaje actual, que se envía por separado a IIAProvider.chat().
    const historial: MensajeChat[] = conversacion.mensajes
      .slice(-15)
      .map((m) => ({ rol: m.rol, texto: m.texto }));

    const respuesta = await this.iaProvider.chat(input.texto, historial);

    conversacion.mensajes.push({ rol: 'usuario', texto: input.texto, timestamp: new Date() });
    conversacion.mensajes.push({ rol: 'bot', texto: respuesta, timestamp: new Date() });

    await this.conversacionRepository.actualizar(conversacion);

    return { conversacionId: conversacion.id, respuesta };
  }

  async obtenerConversacion(id: string, usuarioId: string): Promise<ConversacionChatbotProps> {
    const conversacion = await this.conversacionRepository.buscarPorId(id);
    if (!conversacion) throw new ConversacionNoEncontradaError();
    if (conversacion.usuarioId !== usuarioId) throw new NoEsDueñoDeLaConversacionError();
    return conversacion;
  }
}
