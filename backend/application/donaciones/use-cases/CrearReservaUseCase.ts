import { randomUUID } from 'node:crypto';
import type { DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';
import { DonacionNoEncontradaError } from './ObtenerDonacionUseCase.js';

export interface CrearReservaInput {
  mensaje?: string;
}

export class NoPuedeReservarPropiaDonacionError extends Error {
  constructor() {
    super('No puedes reservar tu propia donación.');
    this.name = 'NoPuedeReservarPropiaDonacionError';
  }
}

/** "Quiero este artículo" — crea la reserva en PENDIENTE (NO compromete la donación todavía, a
 * diferencia de CrearOfertaUseCase/Sprint 2); el donante decide en un segundo paso explícito
 * (ResponderReservaUseCase), mismo criterio que ProponerTruequeUseCase/RF-012. */
export class CrearReservaUseCase {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(donacionId: string, usuarioInteresadoId: string, input: CrearReservaInput): Promise<DonacionResponse> {
    const donacion = await this.donacionRepository.buscarPorId(donacionId);
    if (!donacion) {
      throw new DonacionNoEncontradaError();
    }
    if (donacion.esDueño(usuarioInteresadoId)) {
      throw new NoPuedeReservarPropiaDonacionError();
    }

    donacion.agregarReservaPendiente({
      id: randomUUID(),
      usuarioInteresadoId,
      mensaje: input.mensaje ?? null,
    });

    await this.donacionRepository.actualizar(donacion);
    // Destinatario de la notificación: el donante, quien recibe la reserva.
    this.eventBus.emit('ReservaDonacionCreada', {
      donacionId,
      tituloDonacion: donacion.titulo,
      donanteId: donacion.donanteId,
      usuarioInteresadoId,
    });
    return donacion.toJSON({ incluirUbicacionExacta: false, solicitanteId: usuarioInteresadoId, esAdmin: false });
  }
}
