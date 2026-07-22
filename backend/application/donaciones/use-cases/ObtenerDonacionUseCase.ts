import type { DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';

export class DonacionNoEncontradaError extends Error {
  constructor() {
    super('Donación no encontrada.');
    this.name = 'DonacionNoEncontradaError';
  }
}

/** GET /donaciones/:id — detalle público. Ubicación exacta solo para el dueño o ADMINISTRADOR (ADR-019). */
export class ObtenerDonacionUseCase {
  constructor(private readonly donacionRepository: IDonacionRepository) {}

  async ejecutar(id: string, solicitante?: { id: string; rol: Rol }): Promise<DonacionResponse> {
    const donacion = await this.donacionRepository.buscarPorId(id);
    if (!donacion) {
      throw new DonacionNoEncontradaError();
    }

    const esAdmin = solicitante?.rol === 'ADMINISTRADOR';
    const incluirUbicacionExacta = !!solicitante && (esAdmin || donacion.esDueño(solicitante.id));

    return donacion.toJSON({ incluirUbicacionExacta, solicitanteId: solicitante?.id, esAdmin });
  }
}
