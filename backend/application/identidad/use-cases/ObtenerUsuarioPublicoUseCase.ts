import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import { UsuarioNoEncontradoError } from './ObtenerPerfilUseCase.js';

export interface UsuarioPublicoMinimo {
  id: string;
  nombre: string;
}

/** GET /usuarios/:id — extensión post-cierre (Sprint F5 frontend, `docs/PLAN_FRONTEND.md`): permite
 * a cualquier usuario autenticado resolver el nombre de otro (ej. el otro participante de una
 * conversación, el dueño de una publicación) sin exponer datos sensibles. A diferencia de
 * GET /usuarios/me (dueño) y GET /admin/usuarios (ADMINISTRADOR, Sprint F4), este endpoint es de
 * propósito general y deliberadamente mínimo: solo {id, nombre}, nunca correo/teléfono/rol/estado. */
export class ObtenerUsuarioPublicoUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async ejecutar(id: string): Promise<UsuarioPublicoMinimo> {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) throw new UsuarioNoEncontradoError();
    return { id: usuario.id, nombre: usuario.nombre };
  }
}
