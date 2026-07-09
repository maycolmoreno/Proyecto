import type { SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';

export class SolicitudNoEncontradaError extends Error {
  constructor() {
    super('Solicitud no encontrada.');
    this.name = 'SolicitudNoEncontradaError';
  }
}

/** GET /solicitudes/:id — detalle público. Ubicación exacta solo para el dueño o ADMINISTRADOR (ADR-019). */
export class ObtenerSolicitudUseCase {
  constructor(private readonly solicitudRepository: ISolicitudRepository) {}

  async ejecutar(id: string, solicitante?: { id: string; rol: Rol }): Promise<SolicitudResponse> {
    const solicitud = await this.solicitudRepository.buscarPorId(id);
    if (!solicitud) {
      throw new SolicitudNoEncontradaError();
    }

    const incluirUbicacionExacta =
      !!solicitante && (solicitante.rol === 'ADMINISTRADOR' || solicitud.esDueño(solicitante.id));

    return solicitud.toJSON({
      incluirUbicacionExacta,
      solicitanteId: solicitante?.id,
      esAdmin: solicitante?.rol === 'ADMINISTRADOR',
    });
  }
}
