import { randomUUID } from 'node:crypto';
import type { TruequeResponse } from '@domain/trueques/entities/Trueque.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';
import { TruequeNoEncontradoError } from './ObtenerTruequeUseCase.js';

export interface ProponerTruequeInput {
  truequeOfrecidoId: string;
}

export class NoPuedeProponerSobrePropioTruequeError extends Error {
  constructor() {
    super('No puedes proponer un trueque sobre tu propio trueque.');
    this.name = 'NoPuedeProponerSobrePropioTruequeError';
  }
}

export class TruequeOfrecidoInvalidoError extends Error {
  constructor() {
    super('El trueque ofrecido indicado no existe.');
    this.name = 'TruequeOfrecidoInvalidoError';
  }
}

export class NoEsDueñoDelTruequeOfrecidoError extends Error {
  constructor() {
    super('Solo puedes ofrecer un trueque del que seas dueño.');
    this.name = 'NoEsDueñoDelTruequeOfrecidoError';
  }
}

export class OrigenIgualAOfrecidoError extends Error {
  constructor() {
    super('El trueque origen y el trueque ofrecido no pueden ser el mismo.');
    this.name = 'OrigenIgualAOfrecidoError';
  }
}

/** RF-012/CU-008 Proponer trueque. NO auto-acepta (a diferencia de CU-006, Sprint 2) — crea la
 * propuesta PENDIENTE; la aceptación bilateral (RF-013) es un segundo paso explícito del dueño
 * del trueque origen (ResponderPropuestaUseCase). */
export class ProponerTruequeUseCase {
  constructor(
    private readonly truequeRepository: ITruequeRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(
    truequeOrigenId: string,
    proponenteId: string,
    input: ProponerTruequeInput,
  ): Promise<TruequeResponse> {
    if (truequeOrigenId === input.truequeOfrecidoId) {
      throw new OrigenIgualAOfrecidoError();
    }

    const truequeOrigen = await this.truequeRepository.buscarPorId(truequeOrigenId);
    if (!truequeOrigen) {
      throw new TruequeNoEncontradoError();
    }
    if (truequeOrigen.esDueño(proponenteId)) {
      throw new NoPuedeProponerSobrePropioTruequeError();
    }

    const truequeOfrecido = await this.truequeRepository.buscarPorId(input.truequeOfrecidoId);
    if (!truequeOfrecido) {
      throw new TruequeOfrecidoInvalidoError();
    }
    if (!truequeOfrecido.esDueño(proponenteId)) {
      throw new NoEsDueñoDelTruequeOfrecidoError();
    }

    truequeOrigen.agregarPropuestaPendiente({
      id: randomUUID(),
      truequeOfrecidoId: input.truequeOfrecidoId,
      usuarioProponenteId: proponenteId,
    });

    await this.truequeRepository.actualizar(truequeOrigen);
    // Destinatario de la notificación: el dueño del trueque ORIGEN, quien recibe la propuesta.
    this.eventBus.emit('PropuestaTruequeRecibida', {
      truequeOrigenId,
      proponenteId,
      dueñoOrigenId: truequeOrigen.usuarioId,
    });
    return truequeOrigen.toJSON({ solicitanteId: proponenteId });
  }
}
