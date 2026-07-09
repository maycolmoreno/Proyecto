import type { IWebhookNotifier, WebhookEventoPayload } from '@domain/notificaciones/ports/IWebhookNotifier.js';
import type { ILogsN8nRepository } from '@domain/notificaciones/ports/ILogsN8nRepository.js';

const WORKFLOW_ID = 'donaconnect-eventos';

/** Adaptador de salida — implementa IWebhookNotifier con un POST simple (fetch nativo de Node) hacia
 * el Webhook Trigger único de n8n (Fase 8, sección 2/5). Integración externa no bloqueante (mismo
 * patrón RNF-002 que CloudinariaAdapter/ClaudeAdapter): si `N8N_WEBHOOK_URL` no está configurada o
 * la petición falla, se registra en `logs_n8n` y nunca se relanza el error hacia el llamador — el
 * evento de dominio que originó la notificación ya se completó antes de llegar aquí. */
export class N8nWebhookAdapter implements IWebhookNotifier {
  constructor(
    private readonly webhookUrl: string,
    private readonly logsRepository: ILogsN8nRepository,
  ) {}

  async emitir(payload: WebhookEventoPayload): Promise<void> {
    if (!this.webhookUrl) {
      await this.logsRepository
        .registrar({
          workflowId: WORKFLOW_ID,
          evento: payload.evento,
          payload,
          resultado: 'N8N_WEBHOOK_URL no configurada',
          estado: 'FALLIDO',
        })
        .catch(() => undefined);
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await this.logsRepository.registrar({
        workflowId: WORKFLOW_ID,
        evento: payload.evento,
        payload,
        resultado: response.ok ? 'OK' : `HTTP ${response.status}`,
        estado: response.ok ? 'EXITOSO' : 'FALLIDO',
      });
    } catch (err) {
      await this.logsRepository
        .registrar({
          workflowId: WORKFLOW_ID,
          evento: payload.evento,
          payload,
          resultado: err instanceof Error ? err.message : 'Error desconocido',
          estado: 'FALLIDO',
        })
        .catch(() => undefined);
    }
  }
}
