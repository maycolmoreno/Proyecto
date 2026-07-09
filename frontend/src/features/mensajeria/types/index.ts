// Tipos del dominio de Mensajería — espejo de Conversacion (Fase 4, sección 3; RF-017/CU-015).
export interface Mensaje {
  autorId: string;
  texto: string;
  fecha: string;
  leido: boolean;
}

export interface Conversacion {
  id: string;
  participantes: [string, string];
  entregaIdReferencia: string | null;
  mensajes: Mensaje[];
  fecha: string;
}
