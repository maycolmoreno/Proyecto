// Tipos del dominio de Notificaciones — espejo de INotificacionRepository (Fase 4, sección 3).
export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: string;
  entidadRelacionada: string | null;
  mensaje: string;
  leido: boolean;
  canal: string;
  fecha: string;
}
