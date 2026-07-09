import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { IAuditoriaRepository, RegistrarAuditoriaInput } from '@domain/auditoria/ports/IAuditoriaRepository.js';

/** Adaptador de salida (Hexagonal) — implementa IAuditoriaRepository con Prisma (ADR-008). */
export class PrismaAuditoriaRepository implements IAuditoriaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async registrar(input: RegistrarAuditoriaInput): Promise<void> {
    await this.prisma.auditoria.create({
      data: {
        id: randomUUID(),
        usuarioId: input.idUsuario,
        accion: input.accion,
        entidad: input.entidad,
        idEntidad: input.idEntidad,
        detalle: input.detalle ? (input.detalle as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }
}
