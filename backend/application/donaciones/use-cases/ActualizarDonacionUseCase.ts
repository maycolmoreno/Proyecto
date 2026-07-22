import type { DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { EstadoObjeto } from '@domain/donaciones/value-objects/EstadoObjeto.js';
import { DonacionNoEncontradaError } from './ObtenerDonacionUseCase.js';

export interface ActualizarDonacionInput {
  titulo?: string;
  descripcion?: string;
  estadoObjeto?: EstadoObjeto;
  itemsIncluidos?: string[];
}

export class NoEsDueñoDeLaDonacionError extends Error {
  constructor() {
    super('No tienes permiso para modificar esta donación.');
    this.name = 'NoEsDueñoDeLaDonacionError';
  }
}

/** PATCH /donaciones/:id — solo el dueño (Fase 4, sección 3). */
export class ActualizarDonacionUseCase {
  constructor(private readonly donacionRepository: IDonacionRepository) {}

  async ejecutar(id: string, solicitanteId: string, input: ActualizarDonacionInput): Promise<DonacionResponse> {
    const donacion = await this.donacionRepository.buscarPorId(id);
    if (!donacion) {
      throw new DonacionNoEncontradaError();
    }
    if (!donacion.esDueño(solicitanteId)) {
      throw new NoEsDueñoDeLaDonacionError();
    }

    donacion.actualizar(input);
    await this.donacionRepository.actualizar(donacion);
    return donacion.toJSON({ incluirUbicacionExacta: true, solicitanteId, esAdmin: false });
  }
}
