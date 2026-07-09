import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { CrearImagenInput, IImagenRepository, TipoEntidadImagen } from '@domain/donaciones/ports/IImagenRepository.js';

/** Adaptador de salida — implementa IImagenRepository con Prisma (Fase 6, sección 4). */
export class PrismaImagenRepository implements IImagenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(input: CrearImagenInput): Promise<void> {
    await this.prisma.imagen.create({
      data: {
        id: randomUUID(),
        tipoEntidad: input.tipoEntidad,
        idEntidad: input.idEntidad,
        url: input.url,
        publicId: input.publicId,
      },
    });
  }

  async listarUrlsPorEntidad(tipoEntidad: TipoEntidadImagen, idEntidad: string): Promise<string[]> {
    const rows = await this.prisma.imagen.findMany({
      where: { tipoEntidad, idEntidad },
      orderBy: { fecha: 'asc' },
      select: { url: true },
    });
    return rows.map((row) => row.url);
  }
}
