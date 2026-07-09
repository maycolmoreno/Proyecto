import type { TruequeResponse } from '@domain/trueques/entities/Trueque.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { EstadoObjeto } from '@domain/trueques/value-objects/EstadoObjeto.js';
import { TruequeNoEncontradoError } from './ObtenerTruequeUseCase.js';

export interface ActualizarTruequeInput {
  titulo?: string;
  descripcion?: string;
  estadoObjeto?: EstadoObjeto;
  cancelar?: boolean;
}

export class NoEsDueñoDelTruequeError extends Error {
  constructor() {
    super('No tienes permiso para modificar este trueque.');
    this.name = 'NoEsDueñoDelTruequeError';
  }
}

/** PATCH /trueques/:id — editar o cancelar, solo dueño (Fase 4, sección 3: un único endpoint para ambos). */
export class ActualizarTruequeUseCase {
  constructor(private readonly truequeRepository: ITruequeRepository) {}

  async ejecutar(id: string, solicitanteId: string, input: ActualizarTruequeInput): Promise<TruequeResponse> {
    const trueque = await this.truequeRepository.buscarPorId(id);
    if (!trueque) {
      throw new TruequeNoEncontradoError();
    }
    if (!trueque.esDueño(solicitanteId)) {
      throw new NoEsDueñoDelTruequeError();
    }

    if (input.cancelar) {
      trueque.cancelar();
    } else {
      trueque.actualizar({ titulo: input.titulo, descripcion: input.descripcion, estadoObjeto: input.estadoObjeto });
    }

    await this.truequeRepository.actualizar(trueque);
    return trueque.toJSON({ solicitanteId });
  }
}
