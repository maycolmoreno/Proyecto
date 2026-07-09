export interface LogN8nInput {
  workflowId: string;
  evento: string;
  payload: unknown;
  resultado: string;
  estado: 'EXITOSO' | 'FALLIDO';
}

/** Puerto de salida — MongoDB (Fase 3, `logs_n8n`). Implementado en
 * adapters/notificaciones/repositories/MongooseLogsN8nRepository. */
export interface ILogsN8nRepository {
  registrar(input: LogN8nInput): Promise<void>;
}
