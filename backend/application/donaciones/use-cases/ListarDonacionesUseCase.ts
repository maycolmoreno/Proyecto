import type { DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { DonacionFiltros, IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';

export interface ListarDonacionesInput {
  filtros: DonacionFiltros;
  page: number;
  limit: number;
}

export interface ListarDonacionesResult {
  data: DonacionResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** GET /donaciones — listado público paginado (Fase 4, secciones 7-8). Nunca expone ubicación exacta (ADR-019). */
export class ListarDonacionesUseCase {
  constructor(private readonly donacionRepository: IDonacionRepository) {}

  async ejecutar(input: ListarDonacionesInput): Promise<ListarDonacionesResult> {
    const { items, total } = await this.donacionRepository.listar(input.filtros, {
      page: input.page,
      limit: input.limit,
    });

    return {
      data: items.map((donacion) => donacion.toJSON({ incluirUbicacionExacta: false })),
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }
}
