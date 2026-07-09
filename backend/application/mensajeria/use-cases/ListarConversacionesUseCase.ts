import type { ConversacionResponse } from '@domain/mensajeria/entities/Conversacion.js';
import type { IConversacionRepository } from '@domain/mensajeria/ports/IConversacionRepository.js';

/** GET /conversaciones — CU-015/RF-017, autenticado (propias, Fase 4). */
export class ListarConversacionesUseCase {
  constructor(private readonly conversacionRepository: IConversacionRepository) {}

  async ejecutar(usuarioId: string): Promise<ConversacionResponse[]> {
    const conversaciones = await this.conversacionRepository.listarPorParticipante(usuarioId);
    return conversaciones.map((c) => c.toJSON());
  }
}
