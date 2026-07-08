import type { Request, Response, NextFunction } from 'express';
import { registroSchema, loginSchema } from './schemas.js';
import type { RegistrarUsuarioUseCase } from '../../application/use-cases/RegistrarUsuarioUseCase.js';
import type { IniciarSesionUseCase } from '../../application/use-cases/IniciarSesionUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class AuthController {
  constructor(
    private readonly registrarUsuario: RegistrarUsuarioUseCase,
    private readonly iniciarSesion: IniciarSesionUseCase,
  ) {}

  registro = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = registroSchema.parse(req.body);
      const usuario = await this.registrarUsuario.ejecutar(input);
      res.status(201).json({ data: usuario.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = loginSchema.parse(req.body);
      const resultado = await this.iniciarSesion.ejecutar(input);
      res.status(200).json({ data: resultado });
    } catch (error) {
      next(error);
    }
  };
}
