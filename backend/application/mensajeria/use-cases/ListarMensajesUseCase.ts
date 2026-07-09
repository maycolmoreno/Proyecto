import type { ConversacionResponse } from '@domain/mensajeria/entities/Conversacion.js';
import type { IConversacionRepository } from '@domain/mensajeria/ports/IConversacionRepository.js';

export class ConversacionNoEncontradaError extends Error {
  constructor() {
    super('Todavía no tienes una conversación con este usuario.');
    this.name = 'ConversacionNoEncontradaError';
  }
}

/** GET /conversaciones/:id/mensajes — CU-015/RF-017, Participante (Fase 4). `:id` es el otro
 * participante (ver EnviarMensajeUseCase) — al construirse siempre a partir de `req.usuario.sub`,
 * el requester es automáticamente uno de los dos participantes, sin chequeo adicional. */
export class ListarMensajesUseCase {
  constructor(private readonly conversacionRepository: IConversacionRepository) {}

  async ejecutar(usuarioId: string, otroParticipanteId: string): Promise<ConversacionResponse> {
    const conversacion = await this.conversacionRepository.buscarPorParticipantes(usuarioId, otroParticipanteId);
    if (!conversacion) throw new ConversacionNoEncontradaError();
    return conversacion.toJSON();
  }
}
