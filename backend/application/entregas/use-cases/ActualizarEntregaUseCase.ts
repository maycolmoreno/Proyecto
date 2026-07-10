import type { EntregaResponse } from '@domain/entregas/entities/Entrega.js';
import type { IEntregaRepository } from '@domain/entregas/ports/IEntregaRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';
import type { EntregaAutorizacionService } from '../services/EntregaAutorizacionService.js';
import type { EntregaCierreOrigenService } from '@domain/entregas/services/EntregaCierreOrigenService.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';
import { EntregaNoEncontradaError, NoAutorizadoParaLaEntregaError } from './ObtenerEntregaUseCase.js';

export interface ActualizarEntregaInput {
  confirmar?: boolean;
  cancelar?: boolean;
  fechaProgramada?: Date;
}

/** PATCH /entregas/:id — confirmar/cancelar (CU-010). Solo las partes involucradas (Fase 4, sección 3). */
export class ActualizarEntregaUseCase {
  constructor(
    private readonly entregaRepository: IEntregaRepository,
    private readonly autorizacionService: EntregaAutorizacionService,
    private readonly cierreOrigenService: EntregaCierreOrigenService,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(
    id: string,
    solicitante: { id: string; rol: Rol },
    input: ActualizarEntregaInput,
  ): Promise<EntregaResponse> {
    const entrega = await this.entregaRepository.buscarPorId(id);
    if (!entrega) {
      throw new EntregaNoEncontradaError();
    }
    if (solicitante.rol !== 'ADMINISTRADOR') {
      const autorizado = await this.autorizacionService.esParteInvolucrada(entrega, solicitante.id);
      if (!autorizado) throw new NoAutorizadoParaLaEntregaError();
    }

    if (input.cancelar) {
      entrega.cancelar();
    } else if (input.confirmar) {
      entrega.confirmar(input.fechaProgramada);
    }

    await this.entregaRepository.actualizar(entrega);

    // Sprint 5 — al confirmar, cierra el aggregate origen a su estado terminal positivo (gap de
    // Sprints 2-3, ver fase-06-backend.md historial).
    if (input.confirmar) {
      // Mismo bug corregido que en EntregaCoordinacionService (ver historial) — `idReferencia` es
      // lo que `resolverPartesOrigen` necesita, no el id de la propia Entrega.
      this.eventBus.emit('EntregaConfirmada', {
        id: entrega.id,
        idReferencia: entrega.idReferencia,
        tipoOperacion: entrega.tipoOperacion,
      });
      await this.cierreOrigenService.cerrarOrigen(entrega);
    }

    return entrega.toJSON();
  }
}
