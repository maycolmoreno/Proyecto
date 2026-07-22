import type {
  PrismaClient,
  Prisma,
  Donacion as DonacionRow,
  Categoria as CategoriaRow,
  Ubicacion as UbicacionRow,
  ReservaDonacion as ReservaRow,
} from '@prisma/client';
import { Donacion } from '@domain/donaciones/entities/Donacion.js';
import type {
  DonacionFiltros,
  IDonacionRepository,
  Paginacion,
  ResultadoPaginado,
} from '@domain/donaciones/ports/IDonacionRepository.js';
import type { EstadoObjeto } from '@domain/donaciones/value-objects/EstadoObjeto.js';
import type { EstadoDonacion } from '@domain/donaciones/value-objects/EstadoDonacion.js';
import type { EstadoReserva } from '@domain/donaciones/value-objects/EstadoReserva.js';

type DonacionConRelaciones = DonacionRow & {
  categoria: CategoriaRow;
  ubicacionRetiro: UbicacionRow | null;
  reservas: ReservaRow[];
};

const INCLUDE_RELACIONES = { categoria: true, ubicacionRetiro: true, reservas: true } satisfies Prisma.DonacionInclude;

/** Adaptador de salida (Hexagonal) — implementa IDonacionRepository con Prisma (ADR-008). */
export class PrismaDonacionRepository implements IDonacionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(donacion: Donacion): Promise<void> {
    await this.prisma.donacion.create({
      data: {
        id: donacion.id,
        donanteId: donacion.donanteId,
        categoriaId: donacion.categoriaId,
        titulo: donacion.titulo,
        descripcion: donacion.descripcion,
        estadoObjeto: donacion.estadoObjeto,
        estadoDonacion: donacion.estadoDonacion,
        requiereRetiro: donacion.requiereRetiro,
        ubicacionRetiroId: donacion.ubicacionRetiroId,
        itemsIncluidos: donacion.itemsIncluidos,
        fecha: donacion.fecha,
      },
    });
  }

  async actualizar(donacion: Donacion): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.donacion.update({
        where: { id: donacion.id },
        data: {
          titulo: donacion.titulo,
          descripcion: donacion.descripcion,
          estadoObjeto: donacion.estadoObjeto,
          estadoDonacion: donacion.estadoDonacion,
          itemsIncluidos: donacion.itemsIncluidos,
        },
      }),
      ...donacion.reservas.map((reserva) =>
        this.prisma.reservaDonacion.upsert({
          where: { id: reserva.id },
          create: {
            id: reserva.id,
            donacionId: donacion.id,
            usuarioInteresadoId: reserva.usuarioInteresadoId,
            mensaje: reserva.mensaje,
            estado: reserva.estado,
            fecha: reserva.fecha,
          },
          update: { estado: reserva.estado },
        }),
      ),
    ]);
  }

  async buscarPorId(id: string): Promise<Donacion | null> {
    const row = await this.prisma.donacion.findUnique({ where: { id }, include: INCLUDE_RELACIONES });
    if (!row) return null;
    const imagenes = await this.listarImagenes(id);
    return this.toDomain(row, imagenes);
  }

  async listar(filtros: DonacionFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Donacion>> {
    const where: Prisma.DonacionWhereInput = {
      ...(filtros.estado
        ? { estadoDonacion: filtros.estado as EstadoDonacion }
        : filtros.estadoExcluido
          ? { estadoDonacion: { not: filtros.estadoExcluido as EstadoDonacion } }
          : {}),
      ...(filtros.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
      ...(filtros.requiereRetiro !== undefined ? { requiereRetiro: filtros.requiereRetiro } : {}),
      ...(filtros.provincia || filtros.ciudad
        ? {
            ubicacionRetiro: {
              ...(filtros.provincia ? { provincia: filtros.provincia } : {}),
              ...(filtros.ciudad ? { ciudad: filtros.ciudad } : {}),
            },
          }
        : {}),
      ...(filtros.desde || filtros.hasta
        ? { fecha: { ...(filtros.desde ? { gte: filtros.desde } : {}), ...(filtros.hasta ? { lte: filtros.hasta } : {}) } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.donacion.findMany({
        where,
        include: INCLUDE_RELACIONES,
        orderBy: { fecha: filtros.sort === 'fecha_asc' ? 'asc' : 'desc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.donacion.count({ where }),
    ]);

    const items = await Promise.all(
      rows.map(async (row) => this.toDomain(row, await this.listarImagenes(row.id))),
    );

    return { items, total };
  }

  private async listarImagenes(donacionId: string): Promise<string[]> {
    const rows = await this.prisma.imagen.findMany({
      where: { tipoEntidad: 'DONACION', idEntidad: donacionId },
      orderBy: { fecha: 'asc' },
      select: { url: true },
    });
    return rows.map((row) => row.url);
  }

  private toDomain(row: DonacionConRelaciones, imagenes: string[]): Donacion {
    const donacion = Donacion.reconstituir({
      id: row.id,
      donanteId: row.donanteId,
      categoria: { id: row.categoria.id, nombre: row.categoria.nombre, tipo: row.categoria.tipo },
      titulo: row.titulo,
      descripcion: row.descripcion,
      estadoObjeto: row.estadoObjeto as EstadoObjeto,
      estadoDonacion: row.estadoDonacion as EstadoDonacion,
      requiereRetiro: row.requiereRetiro,
      ubicacionRetiro: row.ubicacionRetiro
        ? {
            id: row.ubicacionRetiro.id,
            provincia: row.ubicacionRetiro.provincia,
            ciudad: row.ubicacionRetiro.ciudad,
            sector: row.ubicacionRetiro.sector,
            referencia: row.ubicacionRetiro.referencia,
            latitud: row.ubicacionRetiro.latitud ? Number(row.ubicacionRetiro.latitud) : null,
            longitud: row.ubicacionRetiro.longitud ? Number(row.ubicacionRetiro.longitud) : null,
          }
        : null,
      itemsIncluidos: row.itemsIncluidos,
      imagenes,
      fecha: row.fecha,
      reservas: row.reservas.map((r) => ({
        id: r.id,
        usuarioInteresadoId: r.usuarioInteresadoId,
        mensaje: r.mensaje,
        estado: r.estado as EstadoReserva,
        fecha: r.fecha,
      })),
    });
    return donacion;
  }
}
