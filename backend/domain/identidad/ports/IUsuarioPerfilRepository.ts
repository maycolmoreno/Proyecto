import type { PerfilFuncional } from '../value-objects/PerfilFuncional.js';

/** Puerto de salida (Opción D, Fase 1) — implementado en adapters/identidad/repositories/PrismaUsuarioPerfilRepository. */
export interface IUsuarioPerfilRepository {
  asignarPerfil(usuarioId: string, perfil: PerfilFuncional): Promise<void>;
  quitarPerfil(usuarioId: string, perfil: PerfilFuncional): Promise<void>;
  listarPerfiles(usuarioId: string): Promise<PerfilFuncional[]>;
  tienePerfil(usuarioId: string, perfil: PerfilFuncional): Promise<boolean>;
  /** Fase 2 — DashboardQueryService (CU-012/RF-019), reemplaza IUsuarioRepository.listarPorRol
   * para los conteos de marketplace ahora que ese enum solo tiene ADMINISTRADOR|USUARIO. */
  contarUsuarios(perfil: PerfilFuncional): Promise<number>;
}
