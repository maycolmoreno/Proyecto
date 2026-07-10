import type { TruequeResponse } from '@domain/trueques/entities/Trueque.js';
import type { TruequeFiltros, ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';

export interface ListarTruequesInput {
  filtros: TruequeFiltros;
  page: number;
  limit: number;
  solicitante?: { id: string; rol: Rol };
}

export interface ListarTruequesResult {
  data: TruequeResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** GET /trueques — listado público paginado (Fase 4, secciones 7-8).
 * Comportamiento de marketplace (extensión post-cierre, ver docs/PLAN_FRONTEND.md): `CANCELADO` se
 * excluye del listado por defecto salvo filtro explícito o solicitante ADMINISTRADOR — ver
 * ListarDonacionesUseCase para el mismo criterio. */
export class ListarTruequesUseCase {
  constructor(private readonly truequeRepository: ITruequeRepository) {}

  async ejecutar(input: ListarTruequesInput): Promise<ListarTruequesResult> {
    const esAdmin = input.solicitante?.rol === 'ADMINISTRADOR';
    const filtros: TruequeFiltros = {
      ...input.filtros,
      estadoExcluido: !input.filtros.estado && !esAdmin ? 'CANCELADO' : undefined,
    };

    const { items, total } = await this.truequeRepository.listar(filtros, {
      page: input.page,
      limit: input.limit,
    });

    return {
      data: items.map((trueque) =>
        trueque.toJSON({ solicitanteId: input.solicitante?.id, esAdmin: input.solicitante?.rol === 'ADMINISTRADOR' }),
      ),
      meta: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
    };
  }
}
