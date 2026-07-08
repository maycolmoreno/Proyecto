import type { Usuario } from '../entities/Usuario.js';

/** Puerto de salida (Hexagonal) — implementado en adapters/repositories/PrismaUsuarioRepository. */
export interface IUsuarioRepository {
  crear(usuario: Usuario): Promise<void>;
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
}
