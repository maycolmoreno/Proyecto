// Tipos del dominio de Chatbot IA — espejo de ChatbotOrquestacionService (Fase 4, sección 3; CU-009/RF-014).
export interface MensajeConversacion {
  rol: 'usuario' | 'bot';
  texto: string;
  timestamp: string;
}

export interface Conversacion {
  id: string;
  usuarioId: string;
  mensajes: MensajeConversacion[];
  canal: string;
  fecha: string;
}

export interface EnviarMensajeInput {
  texto: string;
  sesionId?: string;
}

export interface EnviarMensajeResultado {
  conversacionId: string;
  respuesta: string;
}
