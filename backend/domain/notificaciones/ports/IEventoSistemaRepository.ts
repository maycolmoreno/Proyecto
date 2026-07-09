export interface EventoSistemaInput {
  usuarioId: string | null;
  tipoEvento: string;
  entidad: string;
  referenciaId: string;
  metadatos?: Record<string, unknown>;
}

export interface ConteoPorTipoEvento {
  tipoEvento: string;
  total: number;
}

/** Puerto de salida — MongoDB (Fase 3, `eventos_sistema`). Implementado en
 * adapters/notificaciones/repositories/MongooseEventoSistemaRepository. Alimenta el dashboard de
 * impacto (CU-012) vía agregaciones (Fase 3, sección 4). Solo se registra para los eventos "de
 * cierre positivo" (Fase 6 sección 5: `SolicitudAtendida`, `TruequeIntercambiado`,
 * `EntregaConfirmada`) — no los 12 eventos completos, a diferencia de `INotificacionRepository`. */
export interface IEventoSistemaRepository {
  registrar(input: EventoSistemaInput): Promise<void>;
  contarPorTipoEvento(tipos: string[]): Promise<ConteoPorTipoEvento[]>;
}
