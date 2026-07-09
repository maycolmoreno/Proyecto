import type { Donacion } from '../entities/Donacion.js';

export interface DonacionFiltros {
  estado?: string;
  categoriaId?: string;
  provincia?: string;
  ciudad?: string;
  requiereRetiro?: boolean;
  desde?: Date;
  hasta?: Date;
  sort?: 'fecha_asc' | 'fecha_desc';
}

export interface Paginacion {
  page: number;
  limit: number;
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
}

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaDonacionRepository. */
export interface IDonacionRepository {
  crear(donacion: Donacion): Promise<void>;
  actualizar(donacion: Donacion): Promise<void>;
  buscarPorId(id: string): Promise<Donacion | null>;
  listar(filtros: DonacionFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Donacion>>;
}
