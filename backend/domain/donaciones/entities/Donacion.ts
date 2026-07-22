import type { EstadoObjeto } from '../value-objects/EstadoObjeto.js';
import { type EstadoDonacion, esEstadoTerminal } from '../value-objects/EstadoDonacion.js';
import type { EstadoReserva } from '../value-objects/EstadoReserva.js';

export interface UbicacionRetiro {
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

export interface ReservaProps {
  id: string;
  usuarioInteresadoId: string;
  mensaje: string | null;
  estado: EstadoReserva;
  fecha: Date;
}

export interface ReservaResponse {
  id: string;
  usuarioInteresadoId: string;
  mensaje: string | null;
  estado: EstadoReserva;
  fecha: Date;
}

export interface DonacionProps {
  id: string;
  donanteId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
  estadoDonacion: EstadoDonacion;
  requiereRetiro: boolean;
  ubicacionRetiro: UbicacionRetiro | null;
  itemsIncluidos: string[];
  imagenes: string[];
  fecha: Date;
  /** Reservas ("Quiero este artículo") recibidas sobre esta Donación — entidad hija del aggregate,
   * mismo patrón que `propuestasRecibidas` en Trueque. */
  reservas: ReservaProps[];
}

export interface DonacionResponse {
  id: string;
  donanteId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
  estadoDonacion: EstadoDonacion;
  requiereRetiro: boolean;
  ubicacionRetiro: {
    provincia: string;
    ciudad: string;
    sector: string | null;
    referencia?: string | null;
    latitud?: number | null;
    longitud?: number | null;
  } | null;
  itemsIncluidos: string[];
  imagenes: string[];
  fecha: Date;
  reservas: ReservaResponse[];
}

export class DonacionYaFinalizadaError extends Error {
  constructor() {
    super('La donación ya está entregada o cancelada; no admite más cambios.');
    this.name = 'DonacionYaFinalizadaError';
  }
}

export class DonacionNoDisponibleError extends Error {
  constructor() {
    super('La donación ya fue comprometida en otra oferta, entregada o cancelada.');
    this.name = 'DonacionNoDisponibleError';
  }
}

export class DonacionNoAceptaReservasError extends Error {
  constructor() {
    super('La donación no está disponible para recibir reservas.');
    this.name = 'DonacionNoAceptaReservasError';
  }
}

export class ReservaDuplicadaError extends Error {
  constructor() {
    super('Ya tienes una reserva activa sobre esta donación.');
    this.name = 'ReservaDuplicadaError';
  }
}

export class ReservaNoEncontradaEnDonacionError extends Error {
  constructor() {
    super('Reserva no encontrada en esta donación.');
    this.name = 'ReservaNoEncontradaEnDonacionError';
  }
}

export class ReservaYaRechazadaError extends Error {
  constructor() {
    super('La reserva ya fue rechazada.');
    this.name = 'ReservaYaRechazadaError';
  }
}

export class ReservaYaAceptadaError extends Error {
  constructor() {
    super('Ya existe una reserva aceptada para esta donación.');
    this.name = 'ReservaYaAceptadaError';
  }
}

/** Aggregate Root — Fase 2 (BC-Donaciones). Sin dependencias de framework (Clean Architecture, capa Entities). */
export class Donacion {
  private constructor(private props: DonacionProps) {}

  static crear(input: {
    id: string;
    donanteId: string;
    categoria: CategoriaResumen;
    titulo: string;
    descripcion: string;
    estadoObjeto: EstadoObjeto;
    requiereRetiro: boolean;
    ubicacionRetiro: UbicacionRetiro | null;
    itemsIncluidos?: string[];
  }): Donacion {
    // Regla de negocio #5 (Fase 0/3): ubicacionRetiro solo existe si requiereRetiro = true.
    if (input.requiereRetiro && !input.ubicacionRetiro) {
      throw new Error('requiereRetiro=true exige una ubicación de retiro.');
    }
    return new Donacion({
      ...input,
      ubicacionRetiro: input.requiereRetiro ? input.ubicacionRetiro : null,
      itemsIncluidos: input.itemsIncluidos ?? [],
      estadoDonacion: 'PUBLICADA',
      imagenes: [],
      reservas: [],
      fecha: new Date(),
    });
  }

  static reconstituir(props: DonacionProps): Donacion {
    return new Donacion(props);
  }

  get id(): string {
    return this.props.id;
  }

  get donanteId(): string {
    return this.props.donanteId;
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

  get estadoObjeto(): EstadoObjeto {
    return this.props.estadoObjeto;
  }

  get estadoDonacion(): EstadoDonacion {
    return this.props.estadoDonacion;
  }

  get requiereRetiro(): boolean {
    return this.props.requiereRetiro;
  }

  get ubicacionRetiroId(): string | null {
    return this.props.ubicacionRetiro?.id ?? null;
  }

  get itemsIncluidos(): string[] {
    return this.props.itemsIncluidos;
  }

  get fecha(): Date {
    return this.props.fecha;
  }

  get reservas(): readonly ReservaProps[] {
    return this.props.reservas;
  }

  esDueño(usuarioId: string): boolean {
    return this.props.donanteId === usuarioId;
  }

  estaFinalizada(): boolean {
    return esEstadoTerminal(this.props.estadoDonacion);
  }

  actualizar(input: { titulo?: string; descripcion?: string; estadoObjeto?: EstadoObjeto; itemsIncluidos?: string[] }): void {
    if (this.estaFinalizada()) throw new DonacionYaFinalizadaError();
    if (input.titulo !== undefined) this.props.titulo = input.titulo;
    if (input.descripcion !== undefined) this.props.descripcion = input.descripcion;
    if (input.estadoObjeto !== undefined) this.props.estadoObjeto = input.estadoObjeto;
    if (input.itemsIncluidos !== undefined) this.props.itemsIncluidos = input.itemsIncluidos;
  }

  cancelar(): void {
    if (this.estaFinalizada()) throw new DonacionYaFinalizadaError();
    this.props.estadoDonacion = 'CANCELADA';
  }

  /** RF-009/CU-006 — se invoca al aceptar una oferta sobre esta donación (Sprint 2, un solo paso).
   * Sin esta transición, la donación seguía en PUBLICADA y podía comprometerse en más de una
   * solicitud a la vez (dos ofertas ACEPTADA distintas apuntando a la misma donación). */
  comprometer(): void {
    if (this.props.estadoDonacion !== 'PUBLICADA') throw new DonacionNoDisponibleError();
    this.props.estadoDonacion = 'SOLICITADA';
  }

  /** Revierte el compromiso cuando la oferta que la había comprometido es rechazada — mismo
   * criterio que `Trueque.revertirDeCoordinacion()`: no-op si no está en el estado esperado. */
  liberar(): void {
    if (this.props.estadoDonacion === 'SOLICITADA') {
      this.props.estadoDonacion = 'PUBLICADA';
    }
  }

  /** Sprint 5 — cierra el gap detectado en Sprints 2-3 (ver fase-06-backend.md historial):
   * transiciona al estado terminal positivo cuando se confirma la Entrega asociada. */
  marcarEntregada(): void {
    if (this.estaFinalizada()) throw new DonacionYaFinalizadaError();
    this.props.estadoDonacion = 'ENTREGADA';
  }

  /** A diferencia de Oferta (Sprint 2, un solo paso, auto-aceptada), una Reserva es un segundo paso
   * explícito del donante (RF nuevo) — por eso crearla NO compromete la donación todavía: varias
   * personas pueden mostrar interés mientras sigue PUBLICADA, mismo criterio que las propuestas de
   * Trueque. Solo `aceptarReserva` la compromete (reutiliza `comprometer()`). */
  puedeRecibirReserva(): boolean {
    return this.props.estadoDonacion === 'PUBLICADA';
  }

  agregarReservaPendiente(input: { id: string; usuarioInteresadoId: string; mensaje: string | null }): void {
    if (!this.puedeRecibirReserva()) throw new DonacionNoAceptaReservasError();
    const yaReservaActiva = this.props.reservas.some(
      (r) => r.usuarioInteresadoId === input.usuarioInteresadoId && r.estado !== 'RECHAZADA',
    );
    if (yaReservaActiva) throw new ReservaDuplicadaError();

    this.props.reservas.push({ ...input, estado: 'PENDIENTE', fecha: new Date() });
  }

  /** El donante acepta una reserva pendiente; auto-rechaza las demás y compromete la donación —
   * `comprometer()` es también el guard cross-feature: si la donación ya fue comprometida por una
   * Oferta aceptada (BC-Solicitudes), esta llamada falla con `DonacionNoDisponibleError` en vez de
   * pisar ese compromiso. */
  aceptarReserva(reservaId: string): void {
    const reserva = this.props.reservas.find((r) => r.id === reservaId);
    if (!reserva) throw new ReservaNoEncontradaEnDonacionError();
    if (reserva.estado === 'RECHAZADA') throw new ReservaYaRechazadaError();
    if (this.props.reservas.some((r) => r.estado === 'ACEPTADA')) {
      throw new ReservaYaAceptadaError();
    }

    this.comprometer();
    this.props.reservas = this.props.reservas.map((r) =>
      r.id === reservaId ? { ...r, estado: 'ACEPTADA' } : r.estado === 'PENDIENTE' ? { ...r, estado: 'RECHAZADA' } : r,
    );
  }

  /** Rechaza una reserva, incluso si ya estaba ACEPTADA (revierte el compromiso vía `liberar()`),
   * mismo criterio que `Trueque.rechazarPropuesta`. */
  rechazarReserva(reservaId: string): void {
    const reserva = this.props.reservas.find((r) => r.id === reservaId);
    if (!reserva) throw new ReservaNoEncontradaEnDonacionError();
    if (reserva.estado === 'RECHAZADA') throw new ReservaYaRechazadaError();

    const eraLaAceptada = reserva.estado === 'ACEPTADA';
    reserva.estado = 'RECHAZADA';
    if (eraLaAceptada) this.liberar();
  }

  /** ADR-019: ubicación exacta (referencia/lat/lng) solo visible al dueño o a un administrador.
   * `solicitanteId`/`esAdmin` (nuevo, mismo patrón que `Trueque.toJSON`) filtran qué reservas ve
   * cada quien: el dueño y un admin ven todas, cualquier otro usuario solo la suya (o ninguna). */
  toJSON(opts: { incluirUbicacionExacta: boolean; solicitanteId?: string; esAdmin?: boolean }): DonacionResponse {
    const ubicacion = this.props.ubicacionRetiro;
    const verTodasLasReservas = opts.esAdmin === true || (opts.solicitanteId !== undefined && this.esDueño(opts.solicitanteId));
    const reservasVisibles = this.props.reservas.filter(
      (r) => verTodasLasReservas || r.usuarioInteresadoId === opts.solicitanteId,
    );

    return {
      id: this.props.id,
      donanteId: this.props.donanteId,
      categoria: this.props.categoria,
      titulo: this.props.titulo,
      descripcion: this.props.descripcion,
      estadoObjeto: this.props.estadoObjeto,
      estadoDonacion: this.props.estadoDonacion,
      requiereRetiro: this.props.requiereRetiro,
      ubicacionRetiro: ubicacion
        ? {
            provincia: ubicacion.provincia,
            ciudad: ubicacion.ciudad,
            sector: ubicacion.sector,
            ...(opts.incluirUbicacionExacta
              ? { referencia: ubicacion.referencia, latitud: ubicacion.latitud, longitud: ubicacion.longitud }
              : {}),
          }
        : null,
      itemsIncluidos: this.props.itemsIncluidos,
      imagenes: this.props.imagenes,
      fecha: this.props.fecha,
      reservas: reservasVisibles.map((r) => ({
        id: r.id,
        usuarioInteresadoId: r.usuarioInteresadoId,
        mensaje: r.mensaje,
        estado: r.estado,
        fecha: r.fecha,
      })),
    };
  }
}
