import type { UbicacionSolicitud } from '../entities/Solicitud.js';

export interface CrearUbicacionSolicitudInput {
  provincia: string;
  ciudad: string;
  sector?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

/** Puerto de salida — persiste la ubicación del beneficiario (VO reutilizado de BC-Identidad, Fase 2
 * sección 3) como fila de `ubicaciones` (tipo ESTABLECIDA). Implementado en
 * adapters/repositories/PrismaUbicacionSolicitudRepository. */
export interface IUbicacionSolicitudRepository {
  crear(usuarioId: string, input: CrearUbicacionSolicitudInput): Promise<UbicacionSolicitud>;
}
