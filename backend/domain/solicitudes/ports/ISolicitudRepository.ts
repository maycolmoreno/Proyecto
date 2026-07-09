import type { Solicitud } from '../entities/Solicitud.js';

export interface SolicitudFiltros {
  estado?: string;
  categoriaId?: string;
  urgencia?: string;
  provincia?: string;
  ciudad?: string;
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

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaSolicitudRepository. */
export interface ISolicitudRepository {
  crear(solicitud: Solicitud): Promise<void>;
  actualizar(solicitud: Solicitud): Promise<void>;
  buscarPorId(id: string): Promise<Solicitud | null>;
  /** Resuelve el beneficiario de una Entrega tipo DONACION (Fase 4: autorización de /entregas/:id). */
  buscarPorOfertaDonacionAceptada(donacionId: string): Promise<Solicitud | null>;
  listar(filtros: SolicitudFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Solicitud>>;
}
