import type {
  PrismaClient,
  Prisma,
  Trueque as TruequeRow,
  Categoria as CategoriaRow,
  PropuestaTrueque as PropuestaRow,
} from '@prisma/client';
import { Trueque } from '@domain/trueques/entities/Trueque.js';
import type {
  ITruequeRepository,
  TruequeFiltros,
  Paginacion,
  ResultadoPaginado,
} from '@domain/trueques/ports/ITruequeRepository.js';
import type { EstadoObjeto } from '@domain/trueques/value-objects/EstadoObjeto.js';
import type { EstadoTrueque } from '@domain/trueques/value-objects/EstadoTrueque.js';
import type { EstadoPropuesta } from '@domain/trueques/value-objects/EstadoPropuesta.js';

type TruequeConRelaciones = TruequeRow & { categoria: CategoriaRow; propuestasComoOrigen: PropuestaRow[] };

const INCLUDE_RELACIONES = { categoria: true, propuestasComoOrigen: true } satisfies Prisma.TruequeInclude;

/** Adaptador de salida (Hexagonal) — implementa ITruequeRepository con Prisma (ADR-008). */
export class PrismaTruequeRepository implements ITruequeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(trueque: Trueque): Promise<void> {
    await this.prisma.trueque.create({
      data: {
        id: trueque.id,
        usuarioId: trueque.usuarioId,
        categoriaId: trueque.categoriaId,
        titulo: trueque.titulo,
        descripcion: trueque.descripcion,
        estadoObjeto: trueque.estadoObjeto,
        estadoTrueque: trueque.estadoTrueque,
        fecha: trueque.fecha,
      },
    });
  }

  async actualizar(trueque: Trueque): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.trueque.update({
        where: { id: trueque.id },
        data: {
          titulo: trueque.titulo,
          descripcion: trueque.descripcion,
          estadoObjeto: trueque.estadoObjeto,
          estadoTrueque: trueque.estadoTrueque,
        },
      }),
      ...trueque.propuestasRecibidas.map((propuesta) =>
        this.prisma.propuestaTrueque.upsert({
          where: { id: propuesta.id },
          create: {
            id: propuesta.id,
            truequeOrigenId: trueque.id,
            truequeOfrecidoId: propuesta.truequeOfrecidoId,
            usuarioProponenteId: propuesta.usuarioProponenteId,
            estado: propuesta.estado,
            fecha: propuesta.fecha,
          },
          update: { estado: propuesta.estado },
        }),
      ),
    ]);
  }

  async buscarPorId(id: string): Promise<Trueque | null> {
    const row = await this.prisma.trueque.findUnique({ where: { id }, include: INCLUDE_RELACIONES });
    if (!row) return null;
    const imagenes = await this.listarImagenes(id);
    return this.toDomain(row, imagenes);
  }

  async listar(filtros: TruequeFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Trueque>> {
    const where: Prisma.TruequeWhereInput = {
      ...(filtros.estado
        ? { estadoTrueque: filtros.estado as EstadoTrueque }
        : filtros.estadoExcluido
          ? { estadoTrueque: { not: filtros.estadoExcluido as EstadoTrueque } }
          : {}),
      ...(filtros.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
      ...(filtros.desde || filtros.hasta
        ? { fecha: { ...(filtros.desde ? { gte: filtros.desde } : {}), ...(filtros.hasta ? { lte: filtros.hasta } : {}) } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.trueque.findMany({
        where,
        include: INCLUDE_RELACIONES,
        orderBy: { fecha: filtros.sort === 'fecha_asc' ? 'asc' : 'desc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.trueque.count({ where }),
    ]);

    const items = await Promise.all(rows.map(async (row) => this.toDomain(row, await this.listarImagenes(row.id))));
    return { items, total };
  }

  private async listarImagenes(truequeId: string): Promise<string[]> {
    const rows = await this.prisma.imagen.findMany({
      where: { tipoEntidad: 'TRUEQUE', idEntidad: truequeId },
      orderBy: { fecha: 'asc' },
      select: { url: true },
    });
    return rows.map((row) => row.url);
  }

  private toDomain(row: TruequeConRelaciones, imagenes: string[]): Trueque {
    return Trueque.reconstituir({
      id: row.id,
      usuarioId: row.usuarioId,
      categoria: { id: row.categoria.id, nombre: row.categoria.nombre, tipo: row.categoria.tipo },
      titulo: row.titulo,
      descripcion: row.descripcion,
      estadoObjeto: row.estadoObjeto as EstadoObjeto,
      estadoTrueque: row.estadoTrueque as EstadoTrueque,
      imagenes,
      fecha: row.fecha,
      propuestasRecibidas: row.propuestasComoOrigen.map((p) => ({
        id: p.id,
        truequeOfrecidoId: p.truequeOfrecidoId,
        usuarioProponenteId: p.usuarioProponenteId,
        estado: p.estado as EstadoPropuesta,
        fecha: p.fecha,
      })),
    });
  }
}
