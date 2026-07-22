import type { SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';
import { SolicitudNoEncontradaError } from './ObtenerSolicitudUseCase.js';
import { NoEsDueñoDeLaSolicitudError } from './ActualizarSolicitudUseCase.js';

/** PATCH /solicitudes/:id/ofertas/:ofertaId — RF-010, rechazar manualmente. Beneficiario dueño o ADMINISTRADOR. */
export class ActualizarOfertaUseCase {
  constructor(
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly donacionRepository: IDonacionRepository,
  ) {}

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

    // Se lee ANTES de rechazarOferta (que muta el objeto in-place) para saber si esta oferta era
    // la ACEPTADA — de ser así, hay que liberar la donación que había comprometido (contraparte del
    // `donacion.comprometer()` en CrearOfertaUseCase).
    const oferta = solicitud.ofertas.find((o) => o.id === ofertaId);
    const eraAceptada = oferta?.estado === 'ACEPTADA';

    solicitud.rechazarOferta(ofertaId);
    await this.solicitudRepository.actualizar(solicitud);

    if (eraAceptada && oferta) {
      const donacion = await this.donacionRepository.buscarPorId(oferta.donacionId);
      if (donacion) {
        donacion.liberar();
        await this.donacionRepository.actualizar(donacion);
      }
    }

    return solicitud.toJSON({
      incluirUbicacionExacta: true,
      solicitanteId: solicitante.id,
      esAdmin: solicitante.rol === 'ADMINISTRADOR',
    });
  }
}
