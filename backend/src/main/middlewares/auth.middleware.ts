import type { Request, Response, NextFunction } from 'express';
import type { ITokenService } from '../../modules/identidad/domain/ports/ITokenService.js';

/** Verifica el JWT (Fase 9). No conoce la implementación concreta — recibe el puerto ya inyectado. */
export function crearAuthMiddleware(tokenService: ITokenService) {
  return function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token no proporcionado.' } });
      return;
    }
    try {
      const token = header.slice('Bearer '.length);
      req.usuario = tokenService.verificar(token);
      next();
    } catch {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado.' } });
    }
  };
}
