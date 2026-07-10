// Tipos del dominio de Notificaciones — espejo de INotificacionRepository (Fase 4, sección 3).
export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: string;
  /** 'DONACION'|'SOLICITUD'|'TRUEQUE'|null — extensión post-cierre, permite construir la ruta de
   * destino al hacer click (ver docs/PLAN_FRONTEND.md). */
  entidadTipo: string | null;
  entidadRelacionada: string | null;
  mensaje: string;
  leido: boolean;
  canal: string;
  fecha: string;
}
