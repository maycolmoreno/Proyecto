import type { Request, Response, NextFunction } from 'express';
import { actualizarPerfilesSchema, actualizarUbicacionSchema } from './schemas.js';
import type { ObtenerPerfilUseCase } from '@application/identidad/use-cases/ObtenerPerfilUseCase.js';
import type { ObtenerUsuarioPublicoUseCase } from '@application/identidad/use-cases/ObtenerUsuarioPublicoUseCase.js';
import type { AsignarPerfilesUseCase } from '@application/identidad/use-cases/AsignarPerfilesUseCase.js';
import type { ActualizarUbicacionPerfilUseCase } from '@application/identidad/use-cases/ActualizarUbicacionPerfilUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class UsuariosController {
  constructor(
    private readonly obtenerPerfil: ObtenerPerfilUseCase,
    private readonly obtenerUsuarioPublico: ObtenerUsuarioPublicoUseCase,
    private readonly asignarPerfiles: AsignarPerfilesUseCase,
    private readonly actualizarUbicacionPerfil: ActualizarUbicacionPerfilUseCase,
  ) {}

  /** GET /usuarios/me — requiere authMiddleware (req.usuario ya validado). */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const perfil = await this.obtenerPerfil.ejecutar(req.usuario!.sub);
      res.status(200).json({ data: perfil });
    } catch (error) {
      next(error);
    }
  };

  /** GET /usuarios/:id — extensión post-cierre (Sprint F5 frontend). Cualquier autenticado. */
  obtenerPorId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const usuario = await this.obtenerUsuarioPublico.ejecutar(req.params.id!);
      res.status(200).json({ data: usuario });
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /usuarios/me/perfiles (Opción D, Fase 2) — reemplaza el conjunto completo de perfiles. */
  actualizarPerfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = actualizarPerfilesSchema.parse(req.body);
      const perfiles = await this.asignarPerfiles.ejecutar(req.usuario!.sub, input.perfiles);
      res.status(200).json({ data: { perfiles } });
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /usuarios/me/ubicacion — guarda o actualiza (upsert) la ubicación de perfil. */
  actualizarUbicacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = actualizarUbicacionSchema.parse(req.body);
      const ubicacion = await this.actualizarUbicacionPerfil.ejecutar(req.usuario!.sub, input);
      res.status(200).json({ data: ubicacion });
    } catch (error) {
      next(error);
    }
  };
}
