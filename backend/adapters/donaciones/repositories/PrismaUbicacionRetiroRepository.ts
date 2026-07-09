import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { UbicacionRetiro } from '@domain/donaciones/entities/Donacion.js';
import type {
  CrearUbicacionRetiroInput,
  IUbicacionRetiroRepository,
} from '@domain/donaciones/ports/IUbicacionRetiroRepository.js';

/** Adaptador de salida — persiste la ubicación de retiro como fila de `ubicaciones` (tipo RETIRO). */
export class PrismaUbicacionRetiroRepository implements IUbicacionRetiroRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(usuarioId: string, input: CrearUbicacionRetiroInput): Promise<UbicacionRetiro> {
    const row = await this.prisma.ubicacion.create({
      data: {
        id: randomUUID(),
        usuarioId,
        provincia: input.provincia,
        ciudad: input.ciudad,
        sector: input.sector ?? null,
        referencia: input.referencia ?? null,
        latitud: input.latitud ?? null,
        longitud: input.longitud ?? null,
        tipo: 'RETIRO',
      },
    });

    return {
      id: row.id,
      provincia: row.provincia,
      ciudad: row.ciudad,
      sector: row.sector,
      referencia: row.referencia,
      latitud: row.latitud ? Number(row.latitud) : null,
      longitud: row.longitud ? Number(row.longitud) : null,
    };
  }
}
