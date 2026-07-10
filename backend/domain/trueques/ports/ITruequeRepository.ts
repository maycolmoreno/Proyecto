import type { Trueque } from '../entities/Trueque.js';

export interface TruequeFiltros {
  estado?: string;
  /** Excluye un estado del resultado (mutuamente excluyente con `estado`) — ver DonacionFiltros. */
  estadoExcluido?: string;
  categoriaId?: string;
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

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaTruequeRepository. */
export interface ITruequeRepository {
  crear(trueque: Trueque): Promise<void>;
  actualizar(trueque: Trueque): Promise<void>;
  buscarPorId(id: string): Promise<Trueque | null>;
  listar(filtros: TruequeFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Trueque>>;
}
