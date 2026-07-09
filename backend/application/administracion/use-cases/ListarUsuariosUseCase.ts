import type { UsuarioPublico } from '@domain/identidad/entities/Usuario.js';
import type { IUsuarioRepository, UsuarioFiltros } from '@domain/identidad/ports/IUsuarioRepository.js';

export interface ListarUsuariosInput {
  filtros: UsuarioFiltros;
  page: number;
  limit: number;
}

export interface ListarUsuariosResult {
  data: UsuarioPublico[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** GET /admin/usuarios — extensión post-cierre de Fase 4 (Sprint F4 frontend): no existía forma de
 * listar usuarios para el panel de administración (RF-018/CU-011 solo definió moderar por id). Ver
 * docs/fases/fase-06-backend.md historial. Consulta el repositorio directamente (no ModeracionService,
 * que está scoped a acciones de moderación, no a listar). */
export class ListarUsuariosUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async ejecutar(input: ListarUsuariosInput): Promise<ListarUsuariosResult> {
    const { items, total } = await this.usuarioRepository.listar(input.filtros, {
      page: input.page,
      limit: input.limit,
    });

    return {
      data: items.map((usuario) => usuario.toJSON()),
      meta: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
    };
  }
}
