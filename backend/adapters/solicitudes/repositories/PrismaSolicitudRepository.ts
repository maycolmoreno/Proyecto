import type {
  PrismaClient,
  Prisma,
  Solicitud as SolicitudRow,
  Categoria as CategoriaRow,
  Ubicacion as UbicacionRow,
  OfertaSolicitud as OfertaRow,
} from '@prisma/client';
import { Solicitud } from '@domain/solicitudes/entities/Solicitud.js';
import type {
  ISolicitudRepository,
  SolicitudFiltros,
  Paginacion,
  ResultadoPaginado,
} from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { Urgencia } from '@domain/solicitudes/value-objects/Urgencia.js';
import type { EstadoSolicitud } from '@domain/solicitudes/value-objects/EstadoSolicitud.js';
import type { EstadoOferta } from '@domain/solicitudes/value-objects/EstadoOferta.js';

type SolicitudConRelaciones = SolicitudRow & { categoria: CategoriaRow; ubicacion: UbicacionRow; ofertas: OfertaRow[] };

const INCLUDE_RELACIONES = { categoria: true, ubicacion: true, ofertas: true } satisfies Prisma.SolicitudInclude;

/** Adaptador de salida (Hexagonal) — implementa ISolicitudRepository con Prisma (ADR-008). */
export class PrismaSolicitudRepository implements ISolicitudRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(solicitud: Solicitud): Promise<void> {
    await this.prisma.solicitud.create({
      data: {
        id: solicitud.id,
        beneficiarioId: solicitud.beneficiarioId,
        categoriaId: solicitud.categoriaId,
        titulo: solicitud.titulo,
        descripcion: solicitud.descripcion,
        urgencia: solicitud.urgencia,
        estadoSolicitud: solicitud.estadoSolicitud,
        ubicacionId: solicitud.ubicacionId,
        evidenciaUrl: solicitud.evidenciaUrl,
        fecha: solicitud.fecha,
      },
    });
  }

  async actualizar(solicitud: Solicitud): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.solicitud.update({
        where: { id: solicitud.id },
        data: {
          titulo: solicitud.titulo,
          descripcion: solicitud.descripcion,
          urgencia: solicitud.urgencia,
          estadoSolicitud: solicitud.estadoSolicitud,
        },
      }),
      ...solicitud.ofertas.map((oferta) =>
        this.prisma.ofertaSolicitud.upsert({
          where: { id: oferta.id },
          create: {
            id: oferta.id,
            solicitudId: solicitud.id,
            donanteId: oferta.donanteId,
            donacionId: oferta.donacionId,
            mensaje: oferta.mensaje,
            estado: oferta.estado,
            fecha: oferta.fecha,
          },
          update: { estado: oferta.estado },
        }),
      ),
    ]);
  }

  async buscarPorId(id: string): Promise<Solicitud | null> {
    const row = await this.prisma.solicitud.findUnique({ where: { id }, include: INCLUDE_RELACIONES });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorOfertaDonacionAceptada(donacionId: string): Promise<Solicitud | null> {
    const row = await this.prisma.solicitud.findFirst({
      where: { ofertas: { some: { donacionId, estado: 'ACEPTADA' } } },
      include: INCLUDE_RELACIONES,
    });
    return row ? this.toDomain(row) : null;
  }

  async listar(filtros: SolicitudFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Solicitud>> {
    const where: Prisma.SolicitudWhereInput = {
      ...(filtros.estado ? { estadoSolicitud: filtros.estado as EstadoSolicitud } : {}),
      ...(filtros.categoriaId ? { categoriaId: filtros.categoriaId } : {}),
      ...(filtros.urgencia ? { urgencia: filtros.urgencia as Urgencia } : {}),
      ...(filtros.provincia || filtros.ciudad
        ? {
            ubicacion: {
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
      this.prisma.solicitud.findMany({
        where,
        include: INCLUDE_RELACIONES,
        orderBy: { fecha: filtros.sort === 'fecha_asc' ? 'asc' : 'desc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.solicitud.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  private toDomain(row: SolicitudConRelaciones): Solicitud {
    return Solicitud.reconstituir({
      id: row.id,
      beneficiarioId: row.beneficiarioId,
      categoria: { id: row.categoria.id, nombre: row.categoria.nombre, tipo: row.categoria.tipo },
      titulo: row.titulo,
      descripcion: row.descripcion,
      urgencia: row.urgencia as Urgencia,
      estadoSolicitud: row.estadoSolicitud as EstadoSolicitud,
      ubicacion: {
        id: row.ubicacion.id,
        provincia: row.ubicacion.provincia,
        ciudad: row.ubicacion.ciudad,
        sector: row.ubicacion.sector,
        referencia: row.ubicacion.referencia,
        latitud: row.ubicacion.latitud ? Number(row.ubicacion.latitud) : null,
        longitud: row.ubicacion.longitud ? Number(row.ubicacion.longitud) : null,
      },
      evidenciaUrl: row.evidenciaUrl,
      fecha: row.fecha,
      ofertas: row.ofertas.map((o) => ({
        id: o.id,
        donanteId: o.donanteId,
        donacionId: o.donacionId,
        mensaje: o.mensaje,
        estado: o.estado as EstadoOferta,
        fecha: o.fecha,
      })),
    });
  }
}
