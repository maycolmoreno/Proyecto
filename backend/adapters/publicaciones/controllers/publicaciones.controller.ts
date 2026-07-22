import type { Request, Response, NextFunction } from 'express';
import type { ListarMisPublicacionesUseCase } from '@application/publicaciones/use-cases/ListarMisPublicacionesUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class PublicacionesController {
  constructor(private readonly listarMisPublicacionesUseCase: ListarMisPublicacionesUseCase) {}

  listarMias = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const publicaciones = await this.listarMisPublicacionesUseCase.ejecutar(req.usuario!.sub);
      res.status(200).json({ data: publicaciones });
    } catch (error) {
      next(error);
    }
  };
}
