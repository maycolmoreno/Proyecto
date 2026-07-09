import type { Entrega } from '../entities/Entrega.js';

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaEntregaRepository. */
export interface IEntregaRepository {
  crear(entrega: Entrega): Promise<void>;
  actualizar(entrega: Entrega): Promise<void>;
  buscarPorId(id: string): Promise<Entrega | null>;
  /** Sprint F2 (frontend) — gap real: ninguna respuesta de Solicitud/Donación/Trueque expone el id
   * de su Entrega asociada, y el frontend necesita descubrirla para mostrar/confirmar la
   * coordinación (Fase 5, sección 2.5). `idReferencia` es la Donación o el Trueque ORIGEN (ADR-015). */
  buscarPorReferencia(idReferencia: string): Promise<Entrega | null>;
}
