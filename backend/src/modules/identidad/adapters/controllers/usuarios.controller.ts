import type { Request, Response, NextFunction } from 'express';
import type { IUsuarioRepository } from '../../domain/ports/IUsuarioRepository.js';

export class UsuariosController {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  /** GET /usuarios/me — requiere authMiddleware (req.usuario ya validado). */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const usuario = await this.usuarioRepository.buscarPorId(req.usuario!.sub);
      if (!usuario) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Usuario no encontrado.' } });
        return;
      }
      res.status(200).json({ data: usuario.toJSON() });
    } catch (error) {
      next(error);
    }
  };
}
