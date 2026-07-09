import type { ChatbotOrquestacionService } from '@domain/ia/services/ChatbotOrquestacionService.js';
import type { ConversacionChatbotProps } from '@domain/ia/ports/IConversacionChatbotRepository.js';

/** GET /chatbot/conversaciones/:id — CU-009/RF-014, solo Dueño (Fase 4, sección 3). */
export class ObtenerConversacionUseCase {
  constructor(private readonly chatbotService: ChatbotOrquestacionService) {}

  async ejecutar(id: string, usuarioId: string): Promise<ConversacionChatbotProps> {
    return this.chatbotService.obtenerConversacion(id, usuarioId);
  }
}
