export interface WebhookEventoPayload {
  evento: string;
  entidad: string;
  entidadId: string;
  usuarioDestinoId: string;
  usuarioDestinoCorreo: string;
  datos: Record<string, unknown>;
  timestamp: string;
}

/** Puerto de salida (Open Host Service, Fase 8 sección 2) — implementado en
 * adapters/notificaciones/external/N8nWebhookAdapter (ADR-028/031). Solo 7 eventos de "alto valor"
 * (Fase 8 sección 5) lo invocan — a diferencia de INotificacionRepository (in-app), que cubre los
 * 12 eventos + RiesgoDetectado. */
export interface IWebhookNotifier {
  emitir(payload: WebhookEventoPayload): Promise<void>;
}
