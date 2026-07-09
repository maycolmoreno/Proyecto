import type { Usuario } from '../entities/Usuario.js';
import type { Rol } from '../value-objects/Rol.js';

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaUsuarioRepository. */
export interface IUsuarioRepository {
  crear(usuario: Usuario): Promise<void>;
  actualizar(usuario: Usuario): Promise<void>;
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  /** Sprint 5 — resolver destinatarios de notificaciones por rol (ej. RiesgoDetectado → ADMINISTRADOR). */
  listarPorRol(rol: Rol): Promise<Usuario[]>;
}
