import type { PrismaClient, Entrega as EntregaRow } from '@prisma/client';
import { Entrega } from '@domain/entregas/entities/Entrega.js';
import type { IEntregaRepository } from '@domain/entregas/ports/IEntregaRepository.js';
import type { TipoOperacionEntrega } from '@domain/entregas/value-objects/TipoOperacionEntrega.js';
import type { ModalidadEntrega } from '@domain/entregas/value-objects/ModalidadEntrega.js';
import type { EstadoEntrega } from '@domain/entregas/value-objects/EstadoEntrega.js';

/** Adaptador de salida (Hexagonal) — implementa IEntregaRepository con Prisma (ADR-008). */
export class PrismaEntregaRepository implements IEntregaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(entrega: Entrega): Promise<void> {
    await this.prisma.entrega.create({
      data: {
        id: entrega.id,
        tipoOperacion: entrega.tipoOperacion,
        idReferencia: entrega.idReferencia,
        modalidad: entrega.toJSON().modalidad,
        estado: entrega.estado,
        fechaProgramada: entrega.fechaProgramada,
      },
    });
  }

  async actualizar(entrega: Entrega): Promise<void> {
    await this.prisma.entrega.update({
      where: { id: entrega.id },
      data: { estado: entrega.estado, fechaProgramada: entrega.fechaProgramada },
    });
  }

  async buscarPorId(id: string): Promise<Entrega | null> {
    const row = await this.prisma.entrega.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorReferencia(idReferencia: string): Promise<Entrega | null> {
    const row = await this.prisma.entrega.findFirst({ where: { idReferencia } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: EntregaRow): Entrega {
    return Entrega.reconstituir({
      id: row.id,
      tipoOperacion: row.tipoOperacion as TipoOperacionEntrega,
      idReferencia: row.idReferencia,
      modalidad: row.modalidad as ModalidadEntrega,
      estado: row.estado as EstadoEntrega,
      fechaProgramada: row.fechaProgramada,
    });
  }
}
