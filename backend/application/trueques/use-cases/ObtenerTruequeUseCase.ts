import type { TruequeResponse } from '@domain/trueques/entities/Trueque.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';

export class TruequeNoEncontradoError extends Error {
  constructor() {
    super('Trueque no encontrado.');
    this.name = 'TruequeNoEncontradoError';
  }
}

/** GET /trueques/:id — detalle público (Fase 4, sección 3). */
export class ObtenerTruequeUseCase {
  constructor(private readonly truequeRepository: ITruequeRepository) {}

  async ejecutar(id: string, solicitante?: { id: string; rol: Rol }): Promise<TruequeResponse> {
    const trueque = await this.truequeRepository.buscarPorId(id);
    if (!trueque) {
      throw new TruequeNoEncontradoError();
    }
    return trueque.toJSON({ solicitanteId: solicitante?.id, esAdmin: solicitante?.rol === 'ADMINISTRADOR' });
  }
}
