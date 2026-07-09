import { randomUUID } from 'node:crypto';
import type { SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { EntregaCoordinacionService } from '@domain/entregas/services/EntregaCoordinacionService.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';
import { SolicitudNoEncontradaError } from './ObtenerSolicitudUseCase.js';

export interface CrearOfertaInput {
  donacionId: string;
  mensaje?: string;
}

export class NoPuedeOfertarSobrePropiaSolicitudError extends Error {
  constructor() {
    super('No puedes ofertar sobre tu propia solicitud.');
    this.name = 'NoPuedeOfertarSobrePropiaSolicitudError';
  }
}

export class DonacionInvalidaParaOfertaError extends Error {
  constructor() {
    super('La donación indicada no existe.');
    this.name = 'DonacionInvalidaParaOfertaError';
  }
}

export class NoEsDueñoDeLaDonacionOfrecidaError extends Error {
  constructor() {
    super('Solo puedes ofrecer una donación de la que seas dueño.');
    this.name = 'NoEsDueñoDeLaDonacionOfrecidaError';
  }
}

/** RF-009/CU-006 "Aceptar solicitud como donante" — BC-Donaciones es Customer/Supplier de BC-Solicitudes
 * (Fase 2, sección 2), de ahí la dependencia directa de IDonacionRepository. Un solo paso: la oferta
 * se crea ya ACEPTADA (Fase 4, supuesto de bajo riesgo) y dispara la creación síncrona de la Entrega
 * (Fase 6, sección 5 — "ya invocado en la orquestación síncrona", sin Event Bus todavía). */
export class CrearOfertaUseCase {
  constructor(
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly donacionRepository: IDonacionRepository,
    private readonly entregaCoordinacionService: EntregaCoordinacionService,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(solicitudId: string, donanteId: string, input: CrearOfertaInput): Promise<SolicitudResponse> {
    const solicitud = await this.solicitudRepository.buscarPorId(solicitudId);
    if (!solicitud) {
      throw new SolicitudNoEncontradaError();
    }
    if (solicitud.esDueño(donanteId)) {
      throw new NoPuedeOfertarSobrePropiaSolicitudError();
    }

    const donacion = await this.donacionRepository.buscarPorId(input.donacionId);
    if (!donacion) {
      throw new DonacionInvalidaParaOfertaError();
    }
    if (!donacion.esDueño(donanteId)) {
      throw new NoEsDueñoDeLaDonacionOfrecidaError();
    }

    solicitud.agregarOfertaAceptada({
      id: randomUUID(),
      donanteId,
      donacionId: input.donacionId,
      mensaje: input.mensaje ?? null,
    });

    await this.solicitudRepository.actualizar(solicitud);

    // Un solo paso (Fase 4): la oferta ya nace ACEPTADA, por eso ambos eventos se emiten juntos aquí.
    // El destinatario de la notificación es el beneficiario (dueño de la solicitud), no el donante.
    this.eventBus.emit('OfertaRecibida', {
      solicitudId: solicitud.id,
      donanteId,
      beneficiarioId: solicitud.beneficiarioId,
    });
    this.eventBus.emit('SolicitudAceptadaPorDonante', { id: solicitud.id, beneficiarioId: solicitud.beneficiarioId });

    await this.entregaCoordinacionService.crear({
      id: randomUUID(),
      tipoOperacion: 'DONACION',
      idReferencia: donacion.id,
      requiereRetiro: donacion.requiereRetiro,
    });

    return solicitud.toJSON({ incluirUbicacionExacta: true, solicitanteId: donanteId });
  }
}
