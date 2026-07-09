import type { Request, Response, NextFunction } from 'express';
import type { ObtenerPerfilUseCase } from '@application/identidad/use-cases/ObtenerPerfilUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class UsuariosController {
  constructor(private readonly obtenerPerfil: ObtenerPerfilUseCase) {}

  /** GET /usuarios/me — requiere authMiddleware (req.usuario ya validado). */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const perfil = await this.obtenerPerfil.ejecutar(req.usuario!.sub);
      res.status(200).json({ data: perfil });
    } catch (error) {
      next(error);
    }
  };
}
