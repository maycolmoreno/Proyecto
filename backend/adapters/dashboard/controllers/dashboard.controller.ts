import type { Request, Response, NextFunction } from 'express';
import type { ObtenerDashboardImpactoUseCase } from '@application/dashboard/use-cases/ObtenerDashboardImpactoUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class DashboardController {
  constructor(private readonly obtenerDashboardImpactoUseCase: ObtenerDashboardImpactoUseCase) {}

  obtenerImpacto = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const impacto = await this.obtenerDashboardImpactoUseCase.ejecutar();
      res.status(200).json({ data: impacto });
    } catch (error) {
      next(error);
    }
  };
}
