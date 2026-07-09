import { randomUUID } from 'node:crypto';
import { Conversacion, type ConversacionResponse } from '@domain/mensajeria/entities/Conversacion.js';
import type { IConversacionRepository } from '@domain/mensajeria/ports/IConversacionRepository.js';
import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';

export interface EnviarMensajeInput {
  autorId: string;
  destinatarioId: string;
  texto: string;
}

export class DestinatarioInvalidoError extends Error {
  constructor() {
    super('El destinatario indicado no existe.');
    this.name = 'DestinatarioInvalidoError';
  }
}

export class NoPuedeEnviarseMensajeAsiMismoError extends Error {
  constructor() {
    super('No puedes enviarte un mensaje a ti mismo.');
    this.name = 'NoPuedeEnviarseMensajeAsiMismoError';
  }
}

/** POST /conversaciones/:id/mensajes — CU-015/RF-017 (Fase 4). `:id` es el destinatario (otro
 * participante), no un id de conversación — no existe `POST /conversaciones` explícito en Fase 4;
 * la conversación se crea implícitamente al primer mensaje entre dos usuarios (ver
 * IConversacionRepository, decisión documentada en fase-06-backend.md historial). */
export class EnviarMensajeUseCase {
  constructor(
    private readonly conversacionRepository: IConversacionRepository,
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  async ejecutar(input: EnviarMensajeInput): Promise<ConversacionResponse> {
    if (input.autorId === input.destinatarioId) {
      throw new NoPuedeEnviarseMensajeAsiMismoError();
    }

    const destinatario = await this.usuarioRepository.buscarPorId(input.destinatarioId);
    if (!destinatario) throw new DestinatarioInvalidoError();

    let conversacion = await this.conversacionRepository.buscarPorParticipantes(input.autorId, input.destinatarioId);
    if (!conversacion) {
      conversacion = Conversacion.crear({ id: randomUUID(), participantes: [input.autorId, input.destinatarioId] });
      await this.conversacionRepository.crear(conversacion);
    }

    conversacion.agregarMensaje(input.autorId, input.texto);
    await this.conversacionRepository.actualizar(conversacion);

    return conversacion.toJSON();
  }
}
