import { randomUUID } from 'node:crypto';
import { ReservaNoEncontradaEnDonacionError, type DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { EntregaCoordinacionService } from '@domain/entregas/services/EntregaCoordinacionService.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';
import { DonacionNoEncontradaError } from './ObtenerDonacionUseCase.js';
import { NoEsDueñoDeLaDonacionError } from './ActualizarDonacionUseCase.js';

export interface ResponderReservaInput {
  aceptar?: boolean;
  rechazar?: boolean;
}

/** PATCH /donaciones/:id/reservas/:reservaId — solo el donante. Al aceptar, `Donacion.aceptarReserva`
 * reutiliza `comprometer()` (mismo guard cross-feature que ya usa CrearOfertaUseCase) y se crea la
 * Entrega síncronamente con el mismo `EntregaCoordinacionService` (BC-Entregas es Supporting). */
export class ResponderReservaUseCase {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly entregaCoordinacionService: EntregaCoordinacionService,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(
    donacionId: string,
    reservaId: string,
    solicitanteId: string,
    input: ResponderReservaInput,
  ): Promise<DonacionResponse> {
    const donacion = await this.donacionRepository.buscarPorId(donacionId);
    if (!donacion) {
      throw new DonacionNoEncontradaError();
    }
    if (!donacion.esDueño(solicitanteId)) {
      throw new NoEsDueñoDeLaDonacionError();
    }

    const reserva = donacion.reservas.find((r) => r.id === reservaId);
    if (!reserva) {
      throw new ReservaNoEncontradaEnDonacionError();
    }

    if (input.aceptar) {
      donacion.aceptarReserva(reservaId);
      await this.donacionRepository.actualizar(donacion);

      this.eventBus.emit('ReservaDonacionAceptada', {
        donacionId: donacion.id,
        usuarioInteresadoId: reserva.usuarioInteresadoId,
      });

      await this.entregaCoordinacionService.crear({
        id: randomUUID(),
        tipoOperacion: 'DONACION',
        idReferencia: donacion.id,
        requiereRetiro: donacion.requiereRetiro,
      });
    } else {
      donacion.rechazarReserva(reservaId);
      await this.donacionRepository.actualizar(donacion);

      this.eventBus.emit('ReservaDonacionRechazada', {
        donacionId: donacion.id,
        usuarioInteresadoId: reserva.usuarioInteresadoId,
      });
    }

    return donacion.toJSON({ incluirUbicacionExacta: true, solicitanteId, esAdmin: false });
  }
}
