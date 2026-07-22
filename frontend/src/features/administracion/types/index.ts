// Tipos del dominio de Administración — espejo de ModeracionService (Fase 4, sección 3; RF-018/CU-011).
export type AccionModeracion = 'APROBAR' | 'BLOQUEAR' | 'ELIMINAR';
export type TipoEntidadModeracion = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';
// Opción D (ADR-048) — Rol quedó reducido a seguridad pura; la capacidad de marketplace vive en
// PerfilFuncional (@features/identidad/types), no en RolUsuario.
export type RolUsuario = 'ADMINISTRADOR' | 'USUARIO';
export type EstadoUsuario = 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  fechaCreacion: string;
}

export interface ListarUsuariosFiltros {
  page?: number;
  limit?: number;
  rol?: RolUsuario;
  estado?: EstadoUsuario;
}

export type TipoAnalisisIA = 'CLASIFICACION' | 'MODERACION';

export interface ReporteIA {
  tipo: TipoAnalisisIA;
  tipoEntidad: TipoEntidadModeracion;
  entidadId: string;
  prompt: string;
  respuestaIA: string;
  categoriaSugerida: string | null;
  prioridad: string | null;
  score: number | null;
  riesgoDetectado: boolean | null;
  categoriaRiesgo: string | null;
  confianza: number | null;
  explicacion: string | null;
  fecha: string;
}
