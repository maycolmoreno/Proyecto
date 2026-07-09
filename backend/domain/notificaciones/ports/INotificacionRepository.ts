export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: string;
  entidadRelacionada: string | null;
  mensaje: string;
  leido: boolean;
  canal: string;
  fecha: Date;
}

export interface CrearNotificacionInput {
  usuarioId: string;
  tipo: string;
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
