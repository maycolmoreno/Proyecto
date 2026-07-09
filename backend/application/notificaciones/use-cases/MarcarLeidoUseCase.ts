import type { INotificacionRepository } from '@domain/notificaciones/ports/INotificacionRepository.js';

export class NotificacionNoEncontradaError extends Error {
  constructor() {
    super('Notificación no encontrada.');
    this.name = 'NotificacionNoEncontradaError';
  }
}

/** PATCH /notificaciones/:id/leido — CU-016/RF-020, Dueño (Fase 4). */
export class MarcarLeidoUseCase {
  constructor(private readonly notificacionRepository: INotificacionRepository) {}

  async ejecutar(id: string, usuarioId: string): Promise<void> {
    const actualizado = await this.notificacionRepository.marcarLeido(id, usuarioId);
    if (!actualizado) throw new NotificacionNoEncontradaError();
  }
}
