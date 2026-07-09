import type { EstadoCategoria } from '../value-objects/EstadoCategoria.js';

export interface CategoriaProps {
  id: string;
  nombre: string;
  tipo: string;
  estado: EstadoCategoria;
}

export interface CategoriaPublica {
  id: string;
  nombre: string;
  tipo: string;
  estado: EstadoCategoria;
}

/** Aggregate Root — Fase 2 (BC-Categorías, Shared Kernel). Sin dependencias de framework. */
export class Categoria {
  private constructor(private props: CategoriaProps) {}

  static crear(input: { id: string; nombre: string; tipo: string }): Categoria {
    return new Categoria({ ...input, estado: 'ACTIVA' });
  }

  static reconstituir(props: CategoriaProps): Categoria {
    return new Categoria(props);
  }

  get id(): string {
    return this.props.id;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get tipo(): string {
    return this.props.tipo;
  }

  get estado(): EstadoCategoria {
    return this.props.estado;
  }

  actualizar(input: { nombre?: string; tipo?: string; estado?: EstadoCategoria }): void {
    if (input.nombre !== undefined) this.props.nombre = input.nombre;
    if (input.tipo !== undefined) this.props.tipo = input.tipo;
    if (input.estado !== undefined) this.props.estado = input.estado;
  }

  toJSON(): CategoriaPublica {
    return { id: this.props.id, nombre: this.props.nombre, tipo: this.props.tipo, estado: this.props.estado };
  }
}
