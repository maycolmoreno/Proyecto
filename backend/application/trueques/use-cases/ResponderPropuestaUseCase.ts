import type { TruequeResponse } from '@domain/trueques/entities/Trueque.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { EntregaCoordinacionService } from '@domain/entregas/services/EntregaCoordinacionService.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';
import { randomUUID } from 'node:crypto';
import { TruequeNoEncontradoError } from './ObtenerTruequeUseCase.js';
import { PropuestaNoEncontradaEnTruequeError } from '@domain/trueques/entities/Trueque.js';

export interface ResponderPropuestaInput {
  aceptar?: boolean;
  rechazar?: boolean;
}

export class NoEsDueñoDelTruequeOrigenError extends Error {
  constructor() {
    super('Solo el dueño del trueque origen puede aceptar o rechazar propuestas.');
    this.name = 'NoEsDueñoDelTruequeOrigenError';
  }
}

/** PATCH /trueques/:id/propuestas/:propuestaId — RF-013, aceptación bilateral. Solo el dueño del
 * trueque origen. Al aceptar, ambos trueques (origen y ofrecido, dos aggregates distintos) pasan a
 * EN_COORDINACION y se crea la Entrega síncronamente (mismo domain service que Sprint 2, tipoOperacion
 * TRUEQUE — BC-Entregas es Supporting, consumido ahora también por Trueques, Fase 2). */
export class ResponderPropuestaUseCase {
  constructor(
    private readonly truequeRepository: ITruequeRepository,
    private readonly entregaCoordinacionService: EntregaCoordinacionService,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(
    truequeOrigenId: string,
    propuestaId: string,
    solicitanteId: string,
    input: ResponderPropuestaInput,
  ): Promise<TruequeResponse> {
    const truequeOrigen = await this.truequeRepository.buscarPorId(truequeOrigenId);
    if (!truequeOrigen) {
      throw new TruequeNoEncontradoError();
    }
    if (!truequeOrigen.esDueño(solicitanteId)) {
      throw new NoEsDueñoDelTruequeOrigenError();
    }

    const propuesta = truequeOrigen.propuestasRecibidas.find((p) => p.id === propuestaId);
    if (!propuesta) {
      throw new PropuestaNoEncontradaEnTruequeError();
    }

    if (input.aceptar) {
      truequeOrigen.aceptarPropuesta(propuestaId);
      await this.truequeRepository.actualizar(truequeOrigen);

      const truequeOfrecido = await this.truequeRepository.buscarPorId(propuesta.truequeOfrecidoId);
      if (truequeOfrecido) {
        truequeOfrecido.marcarEnCoordinacion();
        await this.truequeRepository.actualizar(truequeOfrecido);
      }

      // Destinatarios: ambas partes — el dueño del origen (solicitanteId, quien acepta) y el proponente.
      this.eventBus.emit('TruequeAceptadoBilateralmente', {
        truequeOrigenId: truequeOrigen.id,
        truequeOfrecidoId: propuesta.truequeOfrecidoId,
        dueñoOrigenId: solicitanteId,
        proponenteId: propuesta.usuarioProponenteId,
      });

      await this.entregaCoordinacionService.crear({
        id: randomUUID(),
        tipoOperacion: 'TRUEQUE',
        idReferencia: truequeOrigen.id,
        requiereRetiro: false, // Fase 4: trueque no modela ubicación de retiro (a diferencia de Donación)
      });
    } else {
      const revirtioAceptacion = truequeOrigen.rechazarPropuesta(propuestaId);
      await this.truequeRepository.actualizar(truequeOrigen);

      if (revirtioAceptacion) {
        const truequeOfrecido = await this.truequeRepository.buscarPorId(propuesta.truequeOfrecidoId);
        if (truequeOfrecido) {
          truequeOfrecido.revertirDeCoordinacion();
          await this.truequeRepository.actualizar(truequeOfrecido);
        }
      }
    }

    return truequeOrigen.toJSON({ solicitanteId, esAdmin: false });
  }
}
