// Fase 2, sección 7 — catálogo de eventos de dominio. "SolicitudCreada" se agrega aquí aunque
// no aparece en la tabla de 12 eventos de Fase 2 sección 7 (gap del documento): sí se menciona
// explícitamente en la orquestación de CU-005 (Fase 6, sección 2) y en Fase 7 sección 5.
export type NombreEventoDominio =
  | 'UsuarioRegistrado'
  | 'DonacionPublicada'
  | 'SolicitudCreada'
  | 'OfertaRecibida'
  | 'SolicitudAceptadaPorDonante'
  | 'SolicitudAtendida'
  | 'TruequePublicado'
  | 'PropuestaTruequeRecibida'
  | 'TruequeAceptadoBilateralmente'
  | 'TruequeIntercambiado'
  | 'EntregaProgramada'
  | 'EntregaConfirmada'
  | 'PublicacionModerada'
  | 'RiesgoDetectado'
  | 'ReservaDonacionCreada'
  | 'ReservaDonacionAceptada'
  | 'ReservaDonacionRechazada';

/** Puerto de salida — Event Bus in-process (ADR-023). Implementado en main/event-bus.ts;
 * sin adapter/ dedicado porque no envuelve ninguna tecnología externa (Node EventEmitter). */
export interface IEventBus {
  emit<T>(nombre: NombreEventoDominio, payload: T): void;
  on<T>(nombre: NombreEventoDominio, listener: (payload: T) => void | Promise<void>): void;
}
