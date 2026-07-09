import type { Categoria, CategoriaPublica } from '@domain/categorias/entities/Categoria.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';
import type { EstadoCategoria } from '@domain/categorias/value-objects/EstadoCategoria.js';

export interface ActualizarCategoriaInput {
  nombre?: string;
  tipo?: string;
  estado?: EstadoCategoria;
}

export class CategoriaNoEncontradaError extends Error {
  constructor() {
    super('Categoría no encontrada.');
    this.name = 'CategoriaNoEncontradaError';
  }
}

/** PATCH /categorias/:id — ADMINISTRADOR (Fase 4, sección 3). */
export class ActualizarCategoriaUseCase {
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  async ejecutar(id: string, input: ActualizarCategoriaInput): Promise<CategoriaPublica> {
    const categoria: Categoria | null = await this.categoriaRepository.buscarPorId(id);
    if (!categoria) {
      throw new CategoriaNoEncontradaError();
    }

    categoria.actualizar(input);
    await this.categoriaRepository.actualizar(categoria);
    return categoria.toJSON();
  }
}
