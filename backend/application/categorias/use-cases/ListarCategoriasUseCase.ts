import type { Categoria, CategoriaPublica } from '@domain/categorias/entities/Categoria.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';
import type { EstadoCategoria } from '@domain/categorias/value-objects/EstadoCategoria.js';

/** GET /categorias — catálogo público (Fase 4, sección 3). */
export class ListarCategoriasUseCase {
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  async ejecutar(filtros: { estado?: EstadoCategoria }): Promise<CategoriaPublica[]> {
    const categorias: Categoria[] = await this.categoriaRepository.listar(filtros);
    return categorias.map((categoria) => categoria.toJSON());
  }
}
