import type { TipoOperacionEntrega } from '../value-objects/TipoOperacionEntrega.js';
import type { ModalidadEntrega } from '../value-objects/ModalidadEntrega.js';
import { type EstadoEntrega, esEstadoTerminal } from '../value-objects/EstadoEntrega.js';

export interface EntregaProps {
  id: string;
  tipoOperacion: TipoOperacionEntrega;
  idReferencia: string;
  modalidad: ModalidadEntrega;
  estado: EstadoEntrega;
  fechaProgramada: Date | null;
}

export interface EntregaResponse {
  id: string;
  tipoOperacion: TipoOperacionEntrega;
  idReferencia: string;
  modalidad: ModalidadEntrega;
  estado: EstadoEntrega;
  fechaProgramada: Date | null;
}

export class EntregaYaFinalizadaError extends Error {
  constructor() {
    super('La entrega ya está confirmada o cancelada; no admite más cambios.');
    this.name = 'EntregaYaFinalizadaError';
  }
}

/** Aggregate Root — Fase 2 (BC-Entregas). `idReferencia` es una referencia polimórfica hacia
 * Donación o Trueque (ADR-015) — sin FK de base de datos, validada en capa de aplicación. */
export class Entrega {
  private constructor(private props: EntregaProps) {}

  static crear(input: {
    id: string;
    tipoOperacion: TipoOperacionEntrega;
    idReferencia: string;
    modalidad: ModalidadEntrega;
  }): Entrega {
    return new Entrega({ ...input, estado: 'PROGRAMADA', fechaProgramada: null });
  }

  static reconstituir(props: EntregaProps): Entrega {
    return new Entrega(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tipoOperacion(): TipoOperacionEntrega {
    return this.props.tipoOperacion;
  }

  get idReferencia(): string {
    return this.props.idReferencia;
  }

  get estado(): EstadoEntrega {
    return this.props.estado;
  }

  get fechaProgramada(): Date | null {
    return this.props.fechaProgramada;
  }

  estaFinalizada(): boolean {
    return esEstadoTerminal(this.props.estado);
  }

  confirmar(fechaProgramada?: Date): void {
    if (this.estaFinalizada()) throw new EntregaYaFinalizadaError();
    this.props.estado = 'CONFIRMADA';
    if (fechaProgramada) this.props.fechaProgramada = fechaProgramada;
  }

  cancelar(): void {
    if (this.estaFinalizada()) throw new EntregaYaFinalizadaError();
    this.props.estado = 'CANCELADA';
  }

  toJSON(): EntregaResponse {
    return {
      id: this.props.id,
      tipoOperacion: this.props.tipoOperacion,
      idReferencia: this.props.idReferencia,
      modalidad: this.props.modalidad,
      estado: this.props.estado,
      fechaProgramada: this.props.fechaProgramada,
    };
  }
}
