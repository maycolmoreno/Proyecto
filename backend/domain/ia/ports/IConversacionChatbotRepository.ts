export interface MensajeConversacion {
  rol: 'usuario' | 'bot';
  texto: string;
  timestamp: Date;
}

export interface SesionConversacion {
  sesionId: string;
  iniciadoEn: Date;
}

export interface ConversacionChatbotProps {
  id: string;
  usuarioId: string;
  sesiones: SesionConversacion[];
  mensajes: MensajeConversacion[];
  canal: string;
  fecha: Date;
}

export interface CrearConversacionInput {
  usuarioId: string;
  canal: string;
}

/** Puerto de salida — MongoDB (Fase 3, `chatbot_conversaciones`). Implementado en
 * adapters/ia/repositories/MongooseConversacionChatbotRepository. Un documento por usuario
 * (no por sesión): `sesiones[]` registra cada sesionId distinto, `mensajes[]` es el historial
 * combinado (decisión Sprint 4 — Fase 3 §7.1.2 no distingue explícitamente entre ambas lecturas
 * posibles del sketch; ver docs/fases/fase-06-backend.md historial). */
export interface IConversacionChatbotRepository {
  crear(input: CrearConversacionInput): Promise<ConversacionChatbotProps>;
  actualizar(conversacion: ConversacionChatbotProps): Promise<void>;
  buscarPorUsuarioId(usuarioId: string): Promise<ConversacionChatbotProps | null>;
  buscarPorId(id: string): Promise<ConversacionChatbotProps | null>;
}
