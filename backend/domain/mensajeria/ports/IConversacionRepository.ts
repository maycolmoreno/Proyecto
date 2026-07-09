import type { Conversacion } from '../entities/Conversacion.js';

/** Puerto de salida (Hexagonal) — implementado en adapters/mensajeria/repositories/
 * MongooseConversacionRepository (MongoDB, Fase 3, colección `mensajes`). */
export interface IConversacionRepository {
  crear(conversacion: Conversacion): Promise<void>;
  actualizar(conversacion: Conversacion): Promise<void>;
  buscarPorId(id: string): Promise<Conversacion | null>;
  /** Encuentra la conversación entre dos usuarios, sin importar el orden — RF-017: no hay
   * `POST /conversaciones` explícito (Fase 4), una conversación nueva se crea implícitamente
   * al enviar el primer mensaje a un usuario con el que no se tenía conversación previa. */
  buscarPorParticipantes(usuarioIdA: string, usuarioIdB: string): Promise<Conversacion | null>;
  listarPorParticipante(usuarioId: string): Promise<Conversacion[]>;
}
