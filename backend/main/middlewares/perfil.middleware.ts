import type { Request, Response, NextFunction } from 'express';
import type { PerfilFuncional } from '@domain/identidad/value-objects/PerfilFuncional.js';

/** Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md) — mismo patrón que rbacMiddleware, pero
 * verifica pertenencia a un array de perfiles funcionales en vez de igualdad de un único rol.
 * Reemplaza rbacMiddleware en las rutas de Donaciones/Solicitudes/Trueques; rbacMiddleware se
 * conserva exclusivamente para ADMINISTRADOR (admin.routes.ts, categorias.routes.ts). */
export function perfilMiddleware(perfilesPermitidos: PerfilFuncional[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const perfilesUsuario = req.usuario?.perfiles ?? [];
    const autorizado = perfilesPermitidos.some((perfil) => perfilesUsuario.includes(perfil));
    if (!autorizado) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tienes permiso para esta acción.' } });
      return;
    }
    next();
  };
}
