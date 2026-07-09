import type { ModeracionService, AccionModeracion } from '@domain/administracion/services/ModeracionService.js';
import type { UsuarioPublico } from '@domain/identidad/entities/Usuario.js';

/** PATCH /admin/usuarios/:id/moderar — CU-011/RF-018, ADMINISTRADOR (Fase 4). */
export class ModerarUsuarioUseCase {
  constructor(private readonly moderacionService: ModeracionService) {}

  async ejecutar(id: string, accion: AccionModeracion): Promise<UsuarioPublico> {
    return this.moderacionService.moderarUsuario(id, accion);
  }
}
