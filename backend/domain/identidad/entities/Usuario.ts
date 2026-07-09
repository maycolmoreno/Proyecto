import type { Rol } from '../value-objects/Rol.js';
import type { EstadoUsuario } from '../value-objects/EstadoUsuario.js';

export interface UsuarioProps {
  id: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  telefono?: string | null;
  rol: Rol;
  estado: EstadoUsuario;
  fechaCreacion: Date;
}

export interface UsuarioPublico {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: Rol;
  estado: EstadoUsuario;
  fechaCreacion: Date;
}

export class UsuarioYaEliminadoError extends Error {
  constructor() {
    super('El usuario ya fue eliminado; no admite más cambios de estado.');
    this.name = 'UsuarioYaEliminadoError';
  }
}

/** Aggregate Root — Fase 2 (BC-Identidad). Sin dependencias de framework (Clean Architecture, capa Entities). */
export class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  static crear(input: {
    id: string;
    nombre: string;
    correo: string;
    passwordHash: string;
    telefono?: string;
    rol: Rol;
  }): Usuario {
    return new Usuario({
      ...input,
      telefono: input.telefono ?? null,
      estado: 'ACTIVO',
      fechaCreacion: new Date(),
    });
  }

  static reconstituir(props: UsuarioProps): Usuario {
    return new Usuario(props);
  }

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get correo(): string {
    return this.props.correo;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get telefono(): string | null {
    return this.props.telefono ?? null;
  }

  get rol(): Rol {
    return this.props.rol;
  }

  get estado(): EstadoUsuario {
    return this.props.estado;
  }

  get fechaCreacion(): Date {
    return this.props.fechaCreacion;
  }

  estaActivo(): boolean {
    return this.props.estado === 'ACTIVO';
  }

  /** BC-Administración — ModeracionService (Fase 2, sección 6; RF-018/CU-011). ELIMINADO es terminal. */
  activar(): void {
    if (this.props.estado === 'ELIMINADO') throw new UsuarioYaEliminadoError();
    this.props.estado = 'ACTIVO';
  }

  suspender(): void {
    if (this.props.estado === 'ELIMINADO') throw new UsuarioYaEliminadoError();
    this.props.estado = 'SUSPENDIDO';
  }

  eliminar(): void {
    if (this.props.estado === 'ELIMINADO') throw new UsuarioYaEliminadoError();
    this.props.estado = 'ELIMINADO';
  }

  /** Nunca incluye passwordHash — regla de seguridad, Fase 9. */
  toJSON(): UsuarioPublico {
    return {
      id: this.props.id,
      nombre: this.props.nombre,
      correo: this.props.correo,
      telefono: this.telefono,
      rol: this.props.rol,
      estado: this.props.estado,
      fechaCreacion: this.props.fechaCreacion,
    };
  }
}
