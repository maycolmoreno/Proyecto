import { randomUUID } from 'node:crypto';
import { Trueque, type TruequeResponse } from '@domain/trueques/entities/Trueque.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';
import type { EstadoObjeto } from '@domain/trueques/value-objects/EstadoObjeto.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

export interface PublicarTruequeInput {
  usuarioId: string;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
}

export class CategoriaInvalidaError extends Error {
  constructor() {
    super('La categoría indicada no existe o no está activa.');
    this.name = 'CategoriaInvalidaError';
  }
}

/** CU-007 Publicar objeto para trueque (RF-011). Análogo a PublicarDonacionUseCase, sin
 * requiereRetiro/ubicación (Fase 4, sección 4: TruequeCreateDTO no la incluye). */
export class PublicarTruequeUseCase {
  constructor(
    private readonly truequeRepository: ITruequeRepository,
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(input: PublicarTruequeInput): Promise<TruequeResponse> {
    const categoria = await this.categoriaRepository.buscarPorId(input.categoriaId);
    if (!categoria || categoria.estado !== 'ACTIVA') {
      throw new CategoriaInvalidaError();
    }

    const trueque = Trueque.crear({
      id: randomUUID(),
      usuarioId: input.usuarioId,
      categoria: categoria.toJSON(),
      titulo: input.titulo,
      descripcion: input.descripcion,
      estadoObjeto: input.estadoObjeto,
    });

    await this.truequeRepository.crear(trueque);
    // Fase 7 sección 5 — listener real desde Sprint 4: ModeracionIAService.
    // estadoTrueque: consumido también por PublicacionIndexService (Fase 5 diferida) — campo
    // aditivo, no afecta a listeners existentes que no lo leen.
    this.eventBus.emit('TruequePublicado', {
      id: trueque.id,
      titulo: input.titulo,
      descripcion: input.descripcion,
      usuarioId: input.usuarioId,
      estadoTrueque: trueque.estadoTrueque,
    });
    return trueque.toJSON({ solicitanteId: input.usuarioId });
  }
}
