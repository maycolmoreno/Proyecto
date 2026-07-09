import type { SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { SolicitudFiltros, ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';

export interface ListarSolicitudesInput {
  filtros: SolicitudFiltros;
  page: number;
  limit: number;
  solicitante?: { id: string; rol: Rol };
}

export interface ListarSolicitudesResult {
  data: SolicitudResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** GET /solicitudes — listado público paginado (Fase 4, secciones 7-8). Nunca expone ubicación exacta (ADR-019). */
export class ListarSolicitudesUseCase {
  constructor(private readonly solicitudRepository: ISolicitudRepository) {}

  async ejecutar(input: ListarSolicitudesInput): Promise<ListarSolicitudesResult> {
    const { items, total } = await this.solicitudRepository.listar(input.filtros, {
      page: input.page,
      limit: input.limit,
    });

    return {
      data: items.map((solicitud) =>
        solicitud.toJSON({
          incluirUbicacionExacta: false,
          solicitanteId: input.solicitante?.id,
          esAdmin: input.solicitante?.rol === 'ADMINISTRADOR',
        }),
      ),
      meta: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
    };
  }
}
