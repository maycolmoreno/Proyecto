export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: string;
  /** Extensión post-cierre (ver docs/PLAN_FRONTEND.md) — discriminador de dominio
   * ('DONACION'|'SOLICITUD'|'TRUEQUE') que faltaba para poder navegar desde una notificación a la
   * publicación relacionada; antes solo se guardaba `entidadRelacionada` (el id), ambiguo para
   * PublicacionModerada/RiesgoDetectado. */
  entidadTipo: string | null;
  entidadRelacionada: string | null;
  mensaje: string;
  leido: boolean;
  canal: string;
  fecha: Date;
}

export interface CrearNotificacionInput {
  usuarioId: string;
  tipo: string;
  entidadTipo: string | null;
  entidadRelacionada: string | null;
  mensaje: string;
  canal: string;
}

/** Puerto de salida — MongoDB (Fase 3, `notificaciones`). Implementado en
 * adapters/notificaciones/repositories/MongooseNotificacionRepository. */
export interface INotificacionRepository {
  crear(input: CrearNotificacionInput): Promise<void>;
  listarPorUsuario(usuarioId: string): Promise<Notificacion[]>;
  /** Devuelve false si la notificación no existe o no pertenece a `usuarioId` (Fase 4: Dueño). */
  marcarLeido(id: string, usuarioId: string): Promise<boolean>;
}
