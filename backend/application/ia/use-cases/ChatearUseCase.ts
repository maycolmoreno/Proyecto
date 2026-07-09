import type { ChatbotOrquestacionService, ChatearInput, ChatearResultado } from '@domain/ia/services/ChatbotOrquestacionService.js';

/** POST /chatbot/mensajes — CU-009/RF-014 (Fase 4, sección 3). */
export class ChatearUseCase {
  constructor(private readonly chatbotService: ChatbotOrquestacionService) {}

  async ejecutar(input: ChatearInput): Promise<ChatearResultado> {
    return this.chatbotService.chatear(input);
  }
}
