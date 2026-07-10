import type { DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { DonacionFiltros, IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';

export interface ListarDonacionesInput {
  filtros: DonacionFiltros;
  page: number;
  limit: number;
  solicitante?: { id: string; rol: Rol };
}

export interface ListarDonacionesResult {
  data: DonacionResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** GET /donaciones — listado público paginado (Fase 4, secciones 7-8). Nunca expone ubicación exacta (ADR-019).
 * Comportamiento de marketplace (extensión post-cierre, ver docs/PLAN_FRONTEND.md): `CANCELADA` se
 * excluye del listado por defecto cuando no se filtra explícitamente por estado y el solicitante no
 * es ADMINISTRADOR — una publicación cancelada no debe seguir apareciendo al navegar, igual que en
 * cualquier marketplace real (Mercado Libre, eBay). El panel de administración sigue viendo todo
 * porque su token trae `rol=ADMINISTRADOR`. */
export class ListarDonacionesUseCase {
  constructor(private readonly donacionRepository: IDonacionRepository) {}

  async ejecutar(input: ListarDonacionesInput): Promise<ListarDonacionesResult> {
    const esAdmin = input.solicitante?.rol === 'ADMINISTRADOR';
    const filtros: DonacionFiltros = {
      ...input.filtros,
      estadoExcluido: !input.filtros.estado && !esAdmin ? 'CANCELADA' : undefined,
    };

    const { items, total } = await this.donacionRepository.listar(filtros, {
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
