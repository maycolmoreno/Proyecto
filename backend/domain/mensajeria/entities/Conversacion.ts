export interface MensajeProps {
  autorId: string;
  texto: string;
  fecha: Date;
  leido: boolean;
}

export interface ConversacionProps {
  id: string;
  participantes: [string, string];
  entregaIdReferencia: string | null;
  mensajes: MensajeProps[];
  fecha: Date;
}

export interface ConversacionResponse {
  id: string;
  participantes: [string, string];
  entregaIdReferencia: string | null;
  mensajes: MensajeProps[];
  fecha: Date;
}

export class NoEsParticipanteError extends Error {
  constructor() {
    super('No eres participante de esta conversación.');
    this.name = 'NoEsParticipanteError';
  }
}

/** Aggregate Root — Fase 2 (BC-Mensajería, RF-017/CU-015). MongoDB (ADR-012, colección `mensajes`
 * — Fase 3: cada documento es una conversación completa entre 2 participantes, con los mensajes
 * individuales embebidos). Sin dependencias de framework (Clean Architecture, capa Entities). */
export class Conversacion {
  private constructor(private props: ConversacionProps) {}

  static crear(input: {
    id: string;
    participantes: [string, string];
    entregaIdReferencia?: string | null;
  }): Conversacion {
    return new Conversacion({
      id: input.id,
      participantes: input.participantes,
      entregaIdReferencia: input.entregaIdReferencia ?? null,
      mensajes: [],
      fecha: new Date(),
    });
  }

  static reconstituir(props: ConversacionProps): Conversacion {
    return new Conversacion(props);
  }

  get id(): string {
    return this.props.id;
  }

  get participantes(): [string, string] {
    return this.props.participantes;
  }

  get entregaIdReferencia(): string | null {
    return this.props.entregaIdReferencia;
  }

  get mensajes(): MensajeProps[] {
    return this.props.mensajes;
  }

  get fecha(): Date {
    return this.props.fecha;
  }

  esParticipante(usuarioId: string): boolean {
    return this.props.participantes.includes(usuarioId);
  }

  agregarMensaje(autorId: string, texto: string): void {
    if (!this.esParticipante(autorId)) throw new NoEsParticipanteError();
    this.props.mensajes.push({ autorId, texto, fecha: new Date(), leido: false });
  }

  toJSON(): ConversacionResponse {
    return {
      id: this.props.id,
      participantes: this.props.participantes,
      entregaIdReferencia: this.props.entregaIdReferencia,
      mensajes: this.props.mensajes,
      fecha: this.props.fecha,
    };
  }
}
