import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type {
  GuardarUbicacionPerfilInput,
  IUbicacionPerfilRepository,
  UbicacionPerfil,
} from '@domain/identidad/ports/IUbicacionPerfilRepository.js';

/** Adaptador de salida — persiste la ubicación de perfil como fila de `ubicaciones` (tipo PERFIL).
 * `guardar` hace upsert manual (findFirst + update/create) porque Prisma no soporta un `upsert`
 * nativo sobre una condición compuesta sin un índice único declarado — la invariante "una sola
 * PERFIL por usuario" se garantiza acá, a nivel de aplicación (mismo criterio que ya usa el
 * proyecto para otras invariantes que Postgres no expresa directo, ver ADR-011). */
export class PrismaUbicacionPerfilRepository implements IUbicacionPerfilRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async obtener(usuarioId: string): Promise<UbicacionPerfil | null> {
    const row = await this.prisma.ubicacion.findFirst({ where: { usuarioId, tipo: 'PERFIL' } });
    return row ? this.toDomain(row) : null;
  }

  async guardar(usuarioId: string, input: GuardarUbicacionPerfilInput): Promise<UbicacionPerfil> {
    const existente = await this.prisma.ubicacion.findFirst({ where: { usuarioId, tipo: 'PERFIL' } });

    const data = {
      provincia: input.provincia,
      ciudad: input.ciudad,
      sector: input.sector ?? null,
      referencia: input.referencia ?? null,
      latitud: input.latitud ?? null,
      longitud: input.longitud ?? null,
    };

    const row = existente
      ? await this.prisma.ubicacion.update({ where: { id: existente.id }, data })
      : await this.prisma.ubicacion.create({ data: { id: randomUUID(), usuarioId, tipo: 'PERFIL', ...data } });

    return this.toDomain(row);
  }

  private toDomain(row: {
    provincia: string;
    ciudad: string;
    sector: string | null;
    referencia: string | null;
    latitud: unknown;
    longitud: unknown;
  }): UbicacionPerfil {
    return {
      provincia: row.provincia,
      ciudad: row.ciudad,
      sector: row.sector,
      referencia: row.referencia,
      latitud: row.latitud ? Number(row.latitud) : null,
      longitud: row.longitud ? Number(row.longitud) : null,
    };
  }
}
