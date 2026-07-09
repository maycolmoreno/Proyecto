import type { SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';
import { SolicitudNoEncontradaError } from './ObtenerSolicitudUseCase.js';
import { NoEsDueñoDeLaSolicitudError } from './ActualizarSolicitudUseCase.js';

/** PATCH /solicitudes/:id/ofertas/:ofertaId — RF-010, rechazar manualmente. Beneficiario dueño o ADMINISTRADOR. */
export class ActualizarOfertaUseCase {
  constructor(private readonly solicitudRepository: ISolicitudRepository) {}

  async ejecutar(
    solicitudId: string,
    ofertaId: string,
    solicitante: { id: string; rol: Rol },
  ): Promise<SolicitudResponse> {
    const solicitud = await this.solicitudRepository.buscarPorId(solicitudId);
    if (!solicitud) {
      throw new SolicitudNoEncontradaError();
    }
    if (solicitante.rol !== 'ADMINISTRADOR' && !solicitud.esDueño(solicitante.id)) {
      throw new NoEsDueñoDeLaSolicitudError();
    }

    solicitud.rechazarOferta(ofertaId);
    await this.solicitudRepository.actualizar(solicitud);

    return solicitud.toJSON({
      incluirUbicacionExacta: true,
      solicitanteId: solicitante.id,
      esAdmin: solicitante.rol === 'ADMINISTRADOR',
    });
  }
}
