import type { UbicacionRetiro } from '../entities/Donacion.js';

export interface CrearUbicacionRetiroInput {
  provincia: string;
  ciudad: string;
  sector?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

/** Puerto de salida — persiste la ubicación de retiro (VO reutilizado de BC-Identidad, Fase 2 sección 3)
 * como fila de `ubicaciones` (tipo RETIRO) ligada al donante. Implementado en
 * adapters/repositories/PrismaUbicacionRetiroRepository. */
export interface IUbicacionRetiroRepository {
  crear(usuarioId: string, input: CrearUbicacionRetiroInput): Promise<UbicacionRetiro>;
}
