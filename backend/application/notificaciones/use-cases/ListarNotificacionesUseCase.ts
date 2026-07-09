import type { INotificacionRepository, Notificacion } from '@domain/notificaciones/ports/INotificacionRepository.js';

/** GET /notificaciones — CU-016/RF-020, autenticado (propias, Fase 4). */
export class ListarNotificacionesUseCase {
  constructor(private readonly notificacionRepository: INotificacionRepository) {}

  async ejecutar(usuarioId: string): Promise<Notificacion[]> {
    return this.notificacionRepository.listarPorUsuario(usuarioId);
  }
}
