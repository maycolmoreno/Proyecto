import type { Request, Response, NextFunction } from 'express';
import type { ITokenService } from '@domain/identidad/ports/ITokenService.js';

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

/** Igual que authMiddleware pero no rechaza requests sin token — los endpoints públicos con reglas
 * de visibilidad según el solicitante (ej. ADR-019) lo usan para saber si hay un usuario autenticado. */
export function crearAuthOpcionalMiddleware(tokenService: ITokenService) {
  return function authOpcionalMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      try {
        req.usuario = tokenService.verificar(header.slice('Bearer '.length));
      } catch {
        // Token inválido en un endpoint público: se ignora, se sirve como anónimo.
      }
    }
    next();
  };
}
