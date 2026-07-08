import type { Request, Response, NextFunction } from 'express';
import type { Rol } from '../../modules/identidad/domain/value-objects/Rol.js';

/** Matriz RBAC estricta (Fase 4, ADR-016). Se aplica después de authMiddleware. */
export function rbacMiddleware(rolesPermitidos: Rol[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tienes permiso para esta acción.' } });
      return;
    }
    next();
  };
}
