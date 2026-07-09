import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { UbicacionSolicitud } from '@domain/solicitudes/entities/Solicitud.js';
import type {
  CrearUbicacionSolicitudInput,
  IUbicacionSolicitudRepository,
} from '@domain/solicitudes/ports/IUbicacionSolicitudRepository.js';

/** Adaptador de salida — persiste la ubicación del beneficiario como fila de `ubicaciones` (tipo ESTABLECIDA). */
export class PrismaUbicacionSolicitudRepository implements IUbicacionSolicitudRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(usuarioId: string, input: CrearUbicacionSolicitudInput): Promise<UbicacionSolicitud> {
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
        tipo: 'ESTABLECIDA',
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
