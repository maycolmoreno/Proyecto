import type { EstadoObjeto } from '../value-objects/EstadoObjeto.js';
import { type EstadoDonacion, esEstadoTerminal } from '../value-objects/EstadoDonacion.js';

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
  imagenes: string[];
  fecha: Date;
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
  imagenes: string[];
  fecha: Date;
}

export class DonacionYaFinalizadaError extends Error {
  constructor() {
    super('La donación ya está entregada o cancelada; no admite más cambios.');
    this.name = 'DonacionYaFinalizadaError';
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
  }): Donacion {
    // Regla de negocio #5 (Fase 0/3): ubicacionRetiro solo existe si requiereRetiro = true.
    if (input.requiereRetiro && !input.ubicacionRetiro) {
      throw new Error('requiereRetiro=true exige una ubicación de retiro.');
    }
    return new Donacion({
      ...input,
      ubicacionRetiro: input.requiereRetiro ? input.ubicacionRetiro : null,
      estadoDonacion: 'PUBLICADA',
      imagenes: [],
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

  get fecha(): Date {
    return this.props.fecha;
  }

  esDueño(usuarioId: string): boolean {
    return this.props.donanteId === usuarioId;
  }

  estaFinalizada(): boolean {
    return esEstadoTerminal(this.props.estadoDonacion);
  }

  actualizar(input: { titulo?: string; descripcion?: string; estadoObjeto?: EstadoObjeto }): void {
    if (this.estaFinalizada()) throw new DonacionYaFinalizadaError();
    if (input.titulo !== undefined) this.props.titulo = input.titulo;
    if (input.descripcion !== undefined) this.props.descripcion = input.descripcion;
    if (input.estadoObjeto !== undefined) this.props.estadoObjeto = input.estadoObjeto;
  }

  cancelar(): void {
    if (this.estaFinalizada()) throw new DonacionYaFinalizadaError();
    this.props.estadoDonacion = 'CANCELADA';
  }

  /** Sprint 5 — cierra el gap detectado en Sprints 2-3 (ver fase-06-backend.md historial):
   * transiciona al estado terminal positivo cuando se confirma la Entrega asociada. */
  marcarEntregada(): void {
    if (this.estaFinalizada()) throw new DonacionYaFinalizadaError();
    this.props.estadoDonacion = 'ENTREGADA';
  }

  agregarImagen(url: string): void {
    this.props.imagenes.push(url);
  }

  /** ADR-019: ubicación exacta (referencia/lat/lng) solo visible al dueño o a un administrador. */
  toJSON(opts: { incluirUbicacionExacta: boolean }): DonacionResponse {
    const ubicacion = this.props.ubicacionRetiro;
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
      imagenes: this.props.imagenes,
      fecha: this.props.fecha,
    };
  }
}
