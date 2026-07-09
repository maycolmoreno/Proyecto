import type { Usuario } from '../entities/Usuario.js';
import type { Rol } from '../value-objects/Rol.js';
import type { EstadoUsuario } from '../value-objects/EstadoUsuario.js';

export interface UsuarioFiltros {
  rol?: Rol;
  estado?: EstadoUsuario;
}

export interface Paginacion {
  page: number;
  limit: number;
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
}

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaUsuarioRepository. */
export interface IUsuarioRepository {
  crear(usuario: Usuario): Promise<void>;
  actualizar(usuario: Usuario): Promise<void>;
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  /** Sprint 5 — resolver destinatarios de notificaciones por rol (ej. RiesgoDetectado → ADMINISTRADOR). */
  listarPorRol(rol: Rol): Promise<Usuario[]>;
  /** Sprint F4 (frontend) — extensión post-cierre: GET /admin/usuarios necesitaba un listado
   * paginado que no existía (Fase 4 solo definió endpoints de moderar por id). Mismo patrón que
   * ITruequeRepository.listar. Ver docs/fases/fase-06-backend.md historial. */
  listar(filtros: UsuarioFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Usuario>>;
}
