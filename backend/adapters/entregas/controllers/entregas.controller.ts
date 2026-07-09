import type { Request, Response, NextFunction } from 'express';
import { actualizarEntregaSchema } from './schemas.js';
import type { ObtenerEntregaUseCase } from '@application/entregas/use-cases/ObtenerEntregaUseCase.js';
import type { ActualizarEntregaUseCase } from '@application/entregas/use-cases/ActualizarEntregaUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class EntregasController {
  constructor(
    private readonly obtenerEntrega: ObtenerEntregaUseCase,
    private readonly actualizarEntrega: ActualizarEntregaUseCase,
  ) {}

  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entrega = await this.obtenerEntrega.ejecutar(req.params.id!, {
        id: req.usuario!.sub,
        rol: req.usuario!.rol,
      });
      res.status(200).json({ data: entrega });
    } catch (error) {
      next(error);
    }
  };

  obtenerPorReferencia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entrega = await this.obtenerEntrega.ejecutarPorReferencia(req.params.idReferencia!, {
        id: req.usuario!.sub,
        rol: req.usuario!.rol,
      });
      res.status(200).json({ data: entrega });
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = actualizarEntregaSchema.parse(req.body);
      const entrega = await this.actualizarEntrega.ejecutar(
        req.params.id!,
        { id: req.usuario!.sub, rol: req.usuario!.rol },
        input,
      );
      res.status(200).json({ data: entrega });
    } catch (error) {
      next(error);
    }
  };
}
