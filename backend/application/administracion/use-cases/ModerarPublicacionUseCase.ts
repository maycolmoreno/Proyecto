import type {
  ModeracionService,
  AccionModeracion,
  PublicacionModerada,
} from '@domain/administracion/services/ModeracionService.js';
import type { TipoEntidadIA } from '@domain/ia/ports/IAnalisisIARepository.js';

/** PATCH /admin/{donaciones|solicitudes|trueques}/:id/moderar — CU-011/RF-018, ADMINISTRADOR (Fase 4). */
export class ModerarPublicacionUseCase {
  constructor(private readonly moderacionService: ModeracionService) {}

  async ejecutar(tipoEntidad: TipoEntidadIA, id: string, accion: AccionModeracion): Promise<PublicacionModerada> {
    return this.moderacionService.moderarPublicacion(tipoEntidad, id, accion);
  }
}
