import type { Request, Response, NextFunction } from 'express';
import type { ListarNotificacionesUseCase } from '@application/notificaciones/use-cases/ListarNotificacionesUseCase.js';
import type { MarcarLeidoUseCase } from '@application/notificaciones/use-cases/MarcarLeidoUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class NotificacionesController {
  constructor(
    private readonly listarNotificacionesUseCase: ListarNotificacionesUseCase,
    private readonly marcarLeidoUseCase: MarcarLeidoUseCase,
  ) {}

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notificaciones = await this.listarNotificacionesUseCase.ejecutar(req.usuario!.sub);
      res.status(200).json({ data: notificaciones });
    } catch (error) {
      next(error);
    }
  };

  marcarLeido = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.marcarLeidoUseCase.ejecutar(req.params.id!, req.usuario!.sub);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
