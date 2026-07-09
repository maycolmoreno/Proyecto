import type { EntregaResponse } from '@domain/entregas/entities/Entrega.js';
import type { IEntregaRepository } from '@domain/entregas/ports/IEntregaRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';
import type { EntregaAutorizacionService } from '../services/EntregaAutorizacionService.js';

export class EntregaNoEncontradaError extends Error {
  constructor() {
    super('Entrega no encontrada.');
    this.name = 'EntregaNoEncontradaError';
  }
}

export class NoAutorizadoParaLaEntregaError extends Error {
  constructor() {
    super('No tienes permiso para acceder a esta entrega.');
    this.name = 'NoAutorizadoParaLaEntregaError';
  }
}

/** GET /entregas/:id — CU-010. Solo las partes involucradas o ADMINISTRADOR (Fase 4, sección 3). */
export class ObtenerEntregaUseCase {
  constructor(
    private readonly entregaRepository: IEntregaRepository,
    private readonly autorizacionService: EntregaAutorizacionService,
  ) {}

  async ejecutar(id: string, solicitante: { id: string; rol: Rol }): Promise<EntregaResponse> {
    const entrega = await this.entregaRepository.buscarPorId(id);
    return this.autorizarYDevolver(entrega, solicitante);
  }

  /** Sprint F2 (frontend) — GET /entregas/por-referencia/:idReferencia, misma autorización que
   * ejecutar(); el frontend no tiene otra forma de descubrir el id de la Entrega asociada a una
   * Solicitud/Donación/Trueque (ninguna de esas respuestas lo expone). */
  async ejecutarPorReferencia(idReferencia: string, solicitante: { id: string; rol: Rol }): Promise<EntregaResponse> {
    const entrega = await this.entregaRepository.buscarPorReferencia(idReferencia);
    return this.autorizarYDevolver(entrega, solicitante);
  }

  private async autorizarYDevolver(
    entrega: Awaited<ReturnType<IEntregaRepository['buscarPorId']>>,
    solicitante: { id: string; rol: Rol },
  ): Promise<EntregaResponse> {
    if (!entrega) {
      throw new EntregaNoEncontradaError();
    }
    if (solicitante.rol !== 'ADMINISTRADOR') {
      const autorizado = await this.autorizacionService.esParteInvolucrada(entrega, solicitante.id);
      if (!autorizado) throw new NoAutorizadoParaLaEntregaError();
    }
    return entrega.toJSON();
  }
}
