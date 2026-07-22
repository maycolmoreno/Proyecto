import { randomUUID } from 'node:crypto';
import { Donacion, type DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type {
  IUbicacionRetiroRepository,
  CrearUbicacionRetiroInput,
} from '@domain/donaciones/ports/IUbicacionRetiroRepository.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';
import type { EstadoObjeto } from '@domain/donaciones/value-objects/EstadoObjeto.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

export interface PublicarDonacionInput {
  donanteId: string;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
  requiereRetiro: boolean;
  ubicacionRetiro?: CrearUbicacionRetiroInput;
  itemsIncluidos?: string[];
}

export class CategoriaInvalidaError extends Error {
  constructor() {
    super('La categoría indicada no existe o no está activa.');
    this.name = 'CategoriaInvalidaError';
  }
}

/** CU-003 Publicar donación (RF-005). BC-Categorías es Shared Kernel (Fase 2, sección 2). */
export class PublicarDonacionUseCase {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly ubicacionRetiroRepository: IUbicacionRetiroRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(input: PublicarDonacionInput): Promise<DonacionResponse> {
    const categoria = await this.categoriaRepository.buscarPorId(input.categoriaId);
    if (!categoria || categoria.estado !== 'ACTIVA') {
      throw new CategoriaInvalidaError();
    }

    const ubicacionRetiro = input.requiereRetiro
      ? await this.ubicacionRetiroRepository.crear(input.donanteId, input.ubicacionRetiro!)
      : null;

    const donacion = Donacion.crear({
      id: randomUUID(),
      donanteId: input.donanteId,
      categoria: categoria.toJSON(),
      titulo: input.titulo,
      descripcion: input.descripcion,
      estadoObjeto: input.estadoObjeto,
      requiereRetiro: input.requiereRetiro,
      ubicacionRetiro,
      itemsIncluidos: input.itemsIncluidos,
    });

    await this.donacionRepository.crear(donacion);
    // Fase 2 sección 7 — listener real desde Sprint 4: ModeracionIAService.
    // estadoDonacion: consumido también por PublicacionIndexService (Fase 5 diferida) — campo
    // aditivo, no afecta a listeners existentes que no lo leen.
    this.eventBus.emit('DonacionPublicada', {
      id: donacion.id,
      titulo: input.titulo,
      descripcion: input.descripcion,
      donanteId: input.donanteId,
      estadoDonacion: donacion.estadoDonacion,
    });
    return donacion.toJSON({ incluirUbicacionExacta: true });
  }
}
