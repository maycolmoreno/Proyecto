import type { PrismaClient, Categoria as CategoriaRow } from '@prisma/client';
import { Categoria } from '@domain/categorias/entities/Categoria.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';
import type { EstadoCategoria } from '@domain/categorias/value-objects/EstadoCategoria.js';

/** Adaptador de salida (Hexagonal) — implementa ICategoriaRepository con Prisma (ADR-008). */
export class PrismaCategoriaRepository implements ICategoriaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(categoria: Categoria): Promise<void> {
    await this.prisma.categoria.create({
      data: { id: categoria.id, nombre: categoria.nombre, tipo: categoria.tipo, estado: categoria.estado },
    });
  }

  async actualizar(categoria: Categoria): Promise<void> {
    await this.prisma.categoria.update({
      where: { id: categoria.id },
      data: { nombre: categoria.nombre, tipo: categoria.tipo, estado: categoria.estado },
    });
  }

  async buscarPorId(id: string): Promise<Categoria | null> {
    const row = await this.prisma.categoria.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorNombreYTipo(nombre: string, tipo: string): Promise<Categoria | null> {
    const row = await this.prisma.categoria.findUnique({ where: { nombre_tipo: { nombre, tipo } } });
    return row ? this.toDomain(row) : null;
  }

  async listar(filtros: { estado?: EstadoCategoria }): Promise<Categoria[]> {
    const rows = await this.prisma.categoria.findMany({
      where: filtros.estado ? { estado: filtros.estado } : undefined,
      orderBy: { nombre: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: CategoriaRow): Categoria {
    return Categoria.reconstituir({
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      estado: row.estado as EstadoCategoria,
    });
  }
}
