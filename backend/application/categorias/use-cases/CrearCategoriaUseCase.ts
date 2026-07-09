import { randomUUID } from 'node:crypto';
import { Categoria } from '@domain/categorias/entities/Categoria.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';

export interface CrearCategoriaInput {
  nombre: string;
  tipo: string;
}

export class CategoriaYaExisteError extends Error {
  constructor(nombre: string, tipo: string) {
    super(`Ya existe una categoría "${nombre}" del tipo "${tipo}".`);
    this.name = 'CategoriaYaExisteError';
  }
}

/** Administración de categorías (Fase 2, invariante: nombre único por tipo). */
export class CrearCategoriaUseCase {
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  async ejecutar(input: CrearCategoriaInput): Promise<Categoria> {
    const existente = await this.categoriaRepository.buscarPorNombreYTipo(input.nombre, input.tipo);
    if (existente) {
      throw new CategoriaYaExisteError(input.nombre, input.tipo);
    }

    const categoria = Categoria.crear({ id: randomUUID(), nombre: input.nombre, tipo: input.tipo });
    await this.categoriaRepository.crear(categoria);
    return categoria;
  }
}
