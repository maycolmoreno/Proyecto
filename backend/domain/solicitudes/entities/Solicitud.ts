import type { Urgencia } from '../value-objects/Urgencia.js';
import { type EstadoSolicitud, esEstadoTerminal } from '../value-objects/EstadoSolicitud.js';
import type { EstadoOferta } from '../value-objects/EstadoOferta.js';

export interface UbicacionSolicitud {
  id: string;
  provincia: string;
  ciudad: string;
  sector: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface CategoriaResumen {
  id: string;
  nombre: string;
  tipo: string;
}

export interface OfertaProps {
  id: string;
  donanteId: string;
  donacionId: string;
  mensaje: string | null;
  estado: EstadoOferta;
  fecha: Date;
}

export interface SolicitudProps {
  id: string;
  beneficiarioId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  urgencia: Urgencia;
  estadoSolicitud: EstadoSolicitud;
  ubicacion: UbicacionSolicitud;
  evidenciaUrl: string | null;
  fecha: Date;
  ofertas: OfertaProps[];
}

export interface OfertaResponse {
  id: string;
  donanteId: string;
  donacionId: string;
  mensaje: string | null;
  estado: EstadoOferta;
  fecha: Date;
}

export interface SolicitudResponse {
  id: string;
  beneficiarioId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  urgencia: Urgencia;
  estadoSolicitud: EstadoSolicitud;
  ubicacion: {
    provincia: string;
    ciudad: string;
    sector: string | null;
    referencia?: string | null;
    latitud?: number | null;
    longitud?: number | null;
  };
  evidenciaUrl: string | null;
  fecha: Date;
  ofertas: OfertaResponse[];
}

export class SolicitudYaFinalizadaError extends Error {
  constructor() {
    super('La solicitud ya está atendida o cancelada; no admite más cambios.');
    this.name = 'SolicitudYaFinalizadaError';
  }
}

export class SolicitudNoAceptaOfertasError extends Error {
  constructor() {
    super('La solicitud no está abierta a nuevas ofertas.');
    this.name = 'SolicitudNoAceptaOfertasError';
  }
}

export class OfertaDuplicadaError extends Error {
  constructor() {
    super('Ya tienes una oferta activa sobre esta solicitud.');
    this.name = 'OfertaDuplicadaError';
  }
}

export class OfertaNoEncontradaEnSolicitudError extends Error {
  constructor() {
    super('Oferta no encontrada en esta solicitud.');
    this.name = 'OfertaNoEncontradaEnSolicitudError';
  }
}

export class OfertaYaRechazadaError extends Error {
  constructor() {
    super('La oferta ya fue rechazada.');
    this.name = 'OfertaYaRechazadaError';
  }
}

/** Aggregate Root — Fase 2 (BC-Solicitudes). `Oferta` vive dentro del aggregate: su ciclo de vida
 * (aceptar/rechazar) está gobernado por las invariantes de la Solicitud, no tiene repository propio. */
export class Solicitud {
  private constructor(private props: SolicitudProps) {}

  static crear(input: {
    id: string;
    beneficiarioId: string;
    categoria: CategoriaResumen;
    titulo: string;
    descripcion: string;
    urgencia: Urgencia;
    ubicacion: UbicacionSolicitud;
    evidenciaUrl?: string | null;
  }): Solicitud {
    return new Solicitud({
      ...input,
      evidenciaUrl: input.evidenciaUrl ?? null,
      estadoSolicitud: 'ABIERTA',
      ofertas: [],
      fecha: new Date(),
    });
  }

  static reconstituir(props: SolicitudProps): Solicitud {
    return new Solicitud(props);
  }

  get id(): string {
    return this.props.id;
  }

  get beneficiarioId(): string {
    return this.props.beneficiarioId;
  }

  get categoriaId(): string {
    return this.props.categoria.id;
  }

  get titulo(): string {
    return this.props.titulo;
  }

  get descripcion(): string {
    return this.props.descripcion;
  }

  get urgencia(): Urgencia {
    return this.props.urgencia;
  }

  get estadoSolicitud(): EstadoSolicitud {
    return this.props.estadoSolicitud;
  }

  get ubicacionId(): string {
    return this.props.ubicacion.id;
  }

  get evidenciaUrl(): string | null {
    return this.props.evidenciaUrl;
  }

  get fecha(): Date {
    return this.props.fecha;
  }

  get ofertas(): readonly OfertaProps[] {
    return this.props.ofertas;
  }

  esDueño(usuarioId: string): boolean {
    return this.props.beneficiarioId === usuarioId;
  }

  estaFinalizada(): boolean {
    return esEstadoTerminal(this.props.estadoSolicitud);
  }

  puedeRecibirOferta(): boolean {
    return this.props.estadoSolicitud === 'ABIERTA' || this.props.estadoSolicitud === 'EN_REVISION';
  }

  ofertaAceptada(): OfertaProps | null {
    return this.props.ofertas.find((o) => o.estado === 'ACEPTADA') ?? null;
  }

  actualizar(input: { titulo?: string; descripcion?: string; urgencia?: Urgencia }): void {
    if (this.estaFinalizada()) throw new SolicitudYaFinalizadaError();
    if (input.titulo !== undefined) this.props.titulo = input.titulo;
    if (input.descripcion !== undefined) this.props.descripcion = input.descripcion;
    if (input.urgencia !== undefined) this.props.urgencia = input.urgencia;
  }

  cancelar(): void {
    if (this.estaFinalizada()) throw new SolicitudYaFinalizadaError();
    this.props.estadoSolicitud = 'CANCELADA';
  }

  /** Sprint 5 — cierra el gap detectado en Sprints 2-3 (ver fase-06-backend.md historial):
   * transiciona al estado terminal positivo cuando se confirma la Entrega asociada. */
  marcarAtendida(): void {
    if (this.estaFinalizada()) throw new SolicitudYaFinalizadaError();
    this.props.estadoSolicitud = 'ATENDIDA';
  }

  /** RF-009/CU-006 — un solo paso, sin confirmación del beneficiario (Fase 4, supuesto de bajo riesgo). */
  agregarOfertaAceptada(input: { id: string; donanteId: string; donacionId: string; mensaje: string | null }): void {
    if (!this.puedeRecibirOferta()) throw new SolicitudNoAceptaOfertasError();
    const yaOfertoActivo = this.props.ofertas.some((o) => o.donanteId === input.donanteId && o.estado !== 'RECHAZADA');
    if (yaOfertoActivo) throw new OfertaDuplicadaError();

    // Defensivo (ADR-011): con la gating de arriba no debería haber PENDIENTE que auto-rechazar en este
    // flujo de un solo paso, pero se deja explícito por si el flujo se extiende más adelante.
    this.props.ofertas = this.props.ofertas.map((o) => (o.estado === 'PENDIENTE' ? { ...o, estado: 'RECHAZADA' } : o));
    this.props.ofertas.push({ ...input, estado: 'ACEPTADA', fecha: new Date() });
    this.props.estadoSolicitud = 'ACEPTADA_POR_DONANTE';
  }

  /** RF-010 — el beneficiario puede rechazar/cancelar la oferta activa aunque ya esté ACEPTADA (Fase 4). */
  rechazarOferta(ofertaId: string): void {
    const oferta = this.props.ofertas.find((o) => o.id === ofertaId);
    if (!oferta) throw new OfertaNoEncontradaEnSolicitudError();
    if (oferta.estado === 'RECHAZADA') throw new OfertaYaRechazadaError();
    oferta.estado = 'RECHAZADA';
    if (this.props.estadoSolicitud === 'ACEPTADA_POR_DONANTE') {
      this.props.estadoSolicitud = 'ABIERTA';
    }
  }

  /** ADR-019 (ubicación) + Fase 4 (ofertas solo visibles al dueño/admin/donante-autor de cada una). */
  toJSON(opts: { incluirUbicacionExacta: boolean; solicitanteId?: string; esAdmin?: boolean }): SolicitudResponse {
    const ubicacion = this.props.ubicacion;
    const verTodasLasOfertas = opts.esAdmin === true || (opts.solicitanteId !== undefined && this.esDueño(opts.solicitanteId));
    const ofertasVisibles = this.props.ofertas.filter((o) => verTodasLasOfertas || o.donanteId === opts.solicitanteId);

    return {
      id: this.props.id,
      beneficiarioId: this.props.beneficiarioId,
      categoria: this.props.categoria,
      titulo: this.props.titulo,
      descripcion: this.props.descripcion,
      urgencia: this.props.urgencia,
      estadoSolicitud: this.props.estadoSolicitud,
      ubicacion: {
        provincia: ubicacion.provincia,
        ciudad: ubicacion.ciudad,
        sector: ubicacion.sector,
        ...(opts.incluirUbicacionExacta
          ? { referencia: ubicacion.referencia, latitud: ubicacion.latitud, longitud: ubicacion.longitud }
          : {}),
      },
      evidenciaUrl: this.props.evidenciaUrl,
      fecha: this.props.fecha,
      ofertas: ofertasVisibles.map((o) => ({
        id: o.id,
        donanteId: o.donanteId,
        donacionId: o.donacionId,
        mensaje: o.mensaje,
        estado: o.estado,
        fecha: o.fecha,
      })),
    };
  }
}
