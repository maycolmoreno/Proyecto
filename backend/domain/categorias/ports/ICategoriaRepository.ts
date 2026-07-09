import type { Categoria } from '../entities/Categoria.js';

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaCategoriaRepository.
 * BC-Categorías es Shared Kernel (Fase 2, sección 2): otros módulos pueden depender de este puerto
 * directamente para validar/embeber categoría, sin pasar por un caso de uso intermedio. */
export interface ICategoriaRepository {
  crear(categoria: Categoria): Promise<void>;
  actualizar(categoria: Categoria): Promise<void>;
  buscarPorId(id: string): Promise<Categoria | null>;
  buscarPorNombreYTipo(nombre: string, tipo: string): Promise<Categoria | null>;
  listar(filtros: { estado?: 'ACTIVA' | 'INACTIVA' }): Promise<Categoria[]>;
}
