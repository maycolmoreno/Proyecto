import type { EstadoObjeto } from '../value-objects/EstadoObjeto.js';
import { type EstadoTrueque, esEstadoTerminal } from '../value-objects/EstadoTrueque.js';
import type { EstadoPropuesta } from '../value-objects/EstadoPropuesta.js';

export interface CategoriaResumen {
  id: string;
  nombre: string;
  tipo: string;
}

export interface PropuestaProps {
  id: string;
  truequeOfrecidoId: string;
  usuarioProponenteId: string;
  estado: EstadoPropuesta;
  fecha: Date;
}

export interface TruequeProps {
  id: string;
  usuarioId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
  estadoTrueque: EstadoTrueque;
  imagenes: string[];
  fecha: Date;
  /** Propuestas donde ESTE trueque es el origen (el que las recibe) — Fase 2: entidad hija del aggregate. */
  propuestasRecibidas: PropuestaProps[];
}

export interface PropuestaResponse {
  id: string;
  truequeOfrecidoId: string;
  usuarioProponenteId: string;
  estado: EstadoPropuesta;
  fecha: Date;
}

export interface TruequeResponse {
  id: string;
  usuarioId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
  estadoTrueque: EstadoTrueque;
  imagenes: string[];
  fecha: Date;
  propuestasRecibidas: PropuestaResponse[];
}

export class TruequeYaFinalizadoError extends Error {
  constructor() {
    super('El trueque ya está intercambiado o cancelado; no admite más cambios.');
    this.name = 'TruequeYaFinalizadoError';
  }
}

export class TruequeNoAceptaPropuestasError extends Error {
  constructor() {
    super('El trueque no está disponible para recibir propuestas.');
    this.name = 'TruequeNoAceptaPropuestasError';
  }
}

export class PropuestaDuplicadaError extends Error {
  constructor() {
    super('Ya tienes una propuesta activa sobre este trueque.');
    this.name = 'PropuestaDuplicadaError';
  }
}

export class PropuestaNoEncontradaEnTruequeError extends Error {
  constructor() {
    super('Propuesta no encontrada en este trueque.');
    this.name = 'PropuestaNoEncontradaEnTruequeError';
  }
}

export class PropuestaYaRechazadaError extends Error {
  constructor() {
    super('La propuesta ya fue rechazada.');
    this.name = 'PropuestaYaRechazadaError';
  }
}

export class PropuestaYaAceptadaError extends Error {
  constructor() {
    super('Ya existe una propuesta aceptada para este trueque.');
    this.name = 'PropuestaYaAceptadaError';
  }
}

export class TruequeYaComprometidoError extends Error {
  constructor() {
    super('El trueque ofrecido ya fue comprometido en otra negociación.');
    this.name = 'TruequeYaComprometidoError';
  }
}

/** Aggregate Root — Fase 2 (BC-Trueques). `PropuestaTrueque` vive dentro del aggregate del trueque
 * ORIGEN (el que la recibe) — mismo patrón que Oferta dentro de Solicitud (Sprint 2): su ciclo de
 * vida (aceptar/rechazar) está gobernado por las invariantes del trueque origen. */
export class Trueque {
  private constructor(private props: TruequeProps) {}

  static crear(input: {
    id: string;
    usuarioId: string;
    categoria: CategoriaResumen;
    titulo: string;
    descripcion: string;
    estadoObjeto: EstadoObjeto;
  }): Trueque {
    return new Trueque({
      ...input,
      estadoTrueque: 'PUBLICADO',
      imagenes: [],
      propuestasRecibidas: [],
      fecha: new Date(),
    });
  }

  static reconstituir(props: TruequeProps): Trueque {
    return new Trueque(props);
  }

  get id(): string {
    return this.props.id;
  }

  get usuarioId(): string {
    return this.props.usuarioId;
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

  get estadoTrueque(): EstadoTrueque {
    return this.props.estadoTrueque;
  }

  get fecha(): Date {
    return this.props.fecha;
  }

  get propuestasRecibidas(): readonly PropuestaProps[] {
    return this.props.propuestasRecibidas;
  }

  esDueño(usuarioId: string): boolean {
    return this.props.usuarioId === usuarioId;
  }

  estaFinalizado(): boolean {
    return esEstadoTerminal(this.props.estadoTrueque);
  }

  /** A diferencia de Solicitud/Oferta (Sprint 2, un solo paso), aquí SÍ pueden coexistir varias
   * propuestas PENDIENTE de distintos proponentes — la aceptación es un segundo paso explícito (RF-013). */
  puedeRecibirPropuesta(): boolean {
    return this.props.estadoTrueque === 'PUBLICADO' || this.props.estadoTrueque === 'PROPUESTA_RECIBIDA';
  }

  /** Un trueque solo puede ofrecerse como contrapartida (ProponerTruequeUseCase) si no está ya
   * comprometido en otra negociación aceptada ni finalizado — evita proponer con un objeto que ya
   * no está disponible (aunque el chequeo que realmente cierra el gap es el de `marcarEnCoordinacion`,
   * que corre al ACEPTAR; este es el early-check al proponer). */
  puedeSerOfrecido(): boolean {
    return !this.estaFinalizado() && this.props.estadoTrueque !== 'EN_COORDINACION';
  }

  actualizar(input: { titulo?: string; descripcion?: string; estadoObjeto?: EstadoObjeto }): void {
    if (this.estaFinalizado()) throw new TruequeYaFinalizadoError();
    if (input.titulo !== undefined) this.props.titulo = input.titulo;
    if (input.descripcion !== undefined) this.props.descripcion = input.descripcion;
    if (input.estadoObjeto !== undefined) this.props.estadoObjeto = input.estadoObjeto;
  }

  cancelar(): void {
    if (this.estaFinalizado()) throw new TruequeYaFinalizadoError();
    this.props.estadoTrueque = 'CANCELADO';
  }

  /** Sprint 5 — cierra el gap detectado en Sprints 2-3 (ver fase-06-backend.md historial):
   * transiciona al estado terminal positivo cuando se confirma la Entrega asociada (ambos lados). */
  marcarIntercambiado(): void {
    if (this.estaFinalizado()) throw new TruequeYaFinalizadoError();
    this.props.estadoTrueque = 'INTERCAMBIADO';
  }

  agregarImagen(url: string): void {
    this.props.imagenes.push(url);
  }

  /** RF-012/CU-008 — crea la propuesta en PENDIENTE (NO auto-acepta, a diferencia de Sprint 2). */
  agregarPropuestaPendiente(input: { id: string; truequeOfrecidoId: string; usuarioProponenteId: string }): void {
    if (!this.puedeRecibirPropuesta()) throw new TruequeNoAceptaPropuestasError();
    const yaProponeActivo = this.props.propuestasRecibidas.some(
      (p) => p.usuarioProponenteId === input.usuarioProponenteId && p.estado !== 'RECHAZADA',
    );
    if (yaProponeActivo) throw new PropuestaDuplicadaError();

    this.props.propuestasRecibidas.push({ ...input, estado: 'PENDIENTE', fecha: new Date() });
    if (this.props.estadoTrueque === 'PUBLICADO') {
      this.props.estadoTrueque = 'PROPUESTA_RECIBIDA';
    }
  }

  /** RF-013 — el dueño del trueque origen acepta una propuesta pendiente; auto-rechaza las demás. */
  aceptarPropuesta(propuestaId: string): void {
    if (this.estaFinalizado()) throw new TruequeYaFinalizadoError();
    const propuesta = this.props.propuestasRecibidas.find((p) => p.id === propuestaId);
    if (!propuesta) throw new PropuestaNoEncontradaEnTruequeError();
    if (propuesta.estado === 'RECHAZADA') throw new PropuestaYaRechazadaError();
    if (this.props.propuestasRecibidas.some((p) => p.estado === 'ACEPTADA')) {
      throw new PropuestaYaAceptadaError();
    }

    this.props.propuestasRecibidas = this.props.propuestasRecibidas.map((p) =>
      p.id === propuestaId ? { ...p, estado: 'ACEPTADA' } : p.estado === 'PENDIENTE' ? { ...p, estado: 'RECHAZADA' } : p,
    );
    this.props.estadoTrueque = 'EN_COORDINACION';
  }

  /** RF-013 — rechaza una propuesta, incluso si ya estaba ACEPTADA (revierte la coordinación, mismo
   * criterio que Sprint 2 con ofertas). Devuelve true si revirtió una aceptación (para que el caso de
   * uso también revierta el otro trueque involucrado, que es un aggregate distinto). */
  rechazarPropuesta(propuestaId: string): boolean {
    const propuesta = this.props.propuestasRecibidas.find((p) => p.id === propuestaId);
    if (!propuesta) throw new PropuestaNoEncontradaEnTruequeError();
    if (propuesta.estado === 'RECHAZADA') throw new PropuestaYaRechazadaError();

    const eraLaAceptada = propuesta.estado === 'ACEPTADA';
    propuesta.estado = 'RECHAZADA';

    if (eraLaAceptada && this.props.estadoTrueque === 'EN_COORDINACION') {
      this.props.estadoTrueque = 'PROPUESTA_RECIBIDA';
    }

    const quedanPendientes = this.props.propuestasRecibidas.some((p) => p.estado === 'PENDIENTE');
    if (!quedanPendientes && this.props.estadoTrueque === 'PROPUESTA_RECIBIDA') {
      this.props.estadoTrueque = 'PUBLICADO';
    }

    return eraLaAceptada;
  }

  /** Se invoca sobre el trueque OFRECIDO (el otro lado de la negociación) cuando SU propuesta es
   * aceptada/rechazada en el trueque origen — es un aggregate distinto, se actualiza por separado. */
  marcarEnCoordinacion(): void {
    if (this.estaFinalizado()) throw new TruequeYaFinalizadoError();
    // Cierra el gap real: sin este guard, un mismo trueque ofrecido podía aceptarse como
    // contraparte de dos negociaciones distintas (dos orígenes distintos aceptando propuestas que
    // apuntaban al mismo `truequeOfrecidoId`), pisándose entre sí.
    if (this.props.estadoTrueque === 'EN_COORDINACION') throw new TruequeYaComprometidoError();
    this.props.estadoTrueque = 'EN_COORDINACION';
  }

  revertirDeCoordinacion(): void {
    if (this.props.estadoTrueque === 'EN_COORDINACION') {
      this.props.estadoTrueque = 'PUBLICADO';
    }
  }

  toJSON(opts: { solicitanteId?: string; esAdmin?: boolean }): TruequeResponse {
    const verTodasLasPropuestas = opts.esAdmin === true || (opts.solicitanteId !== undefined && this.esDueño(opts.solicitanteId));
    const propuestasVisibles = this.props.propuestasRecibidas.filter(
      (p) => verTodasLasPropuestas || p.usuarioProponenteId === opts.solicitanteId,
    );

    return {
      id: this.props.id,
      usuarioId: this.props.usuarioId,
      categoria: this.props.categoria,
      titulo: this.props.titulo,
      descripcion: this.props.descripcion,
      estadoObjeto: this.props.estadoObjeto,
      estadoTrueque: this.props.estadoTrueque,
      imagenes: this.props.imagenes,
      fecha: this.props.fecha,
      propuestasRecibidas: propuestasVisibles.map((p) => ({
        id: p.id,
        truequeOfrecidoId: p.truequeOfrecidoId,
        usuarioProponenteId: p.usuarioProponenteId,
        estado: p.estado,
        fecha: p.fecha,
      })),
    };
  }
}
