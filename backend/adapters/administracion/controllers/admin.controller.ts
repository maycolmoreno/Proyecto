import type { Request, Response, NextFunction } from 'express';
import { moderarSchema, listarUsuariosQuerySchema } from './schemas.js';
import type { ModerarPublicacionUseCase } from '@application/administracion/use-cases/ModerarPublicacionUseCase.js';
import type { ModerarUsuarioUseCase } from '@application/administracion/use-cases/ModerarUsuarioUseCase.js';
import type { ObtenerReportesUseCase } from '@application/administracion/use-cases/ObtenerReportesUseCase.js';
import type { ListarUsuariosUseCase } from '@application/administracion/use-cases/ListarUsuariosUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class AdminController {
  constructor(
    private readonly moderarPublicacionUseCase: ModerarPublicacionUseCase,
    private readonly moderarUsuarioUseCase: ModerarUsuarioUseCase,
    private readonly obtenerReportesUseCase: ObtenerReportesUseCase,
    private readonly listarUsuariosUseCase: ListarUsuariosUseCase,
  ) {}

  listarUsuarios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, ...filtros } = listarUsuariosQuerySchema.parse(req.query);
      const resultado = await this.listarUsuariosUseCase.ejecutar({ filtros, page, limit });
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  moderarDonacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accion } = moderarSchema.parse(req.body);
      const donacion = await this.moderarPublicacionUseCase.ejecutar('DONACION', req.params.id!, accion);
      res.status(200).json({ data: donacion });
    } catch (error) {
      next(error);
    }
  };

  moderarSolicitud = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accion } = moderarSchema.parse(req.body);
      const solicitud = await this.moderarPublicacionUseCase.ejecutar('SOLICITUD', req.params.id!, accion);
      res.status(200).json({ data: solicitud });
    } catch (error) {
      next(error);
    }
  };

  moderarTrueque = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accion } = moderarSchema.parse(req.body);
      const trueque = await this.moderarPublicacionUseCase.ejecutar('TRUEQUE', req.params.id!, accion);
      res.status(200).json({ data: trueque });
    } catch (error) {
      next(error);
    }
  };

  moderarUsuario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { accion } = moderarSchema.parse(req.body);
      const usuario = await this.moderarUsuarioUseCase.ejecutar(req.params.id!, accion);
      res.status(200).json({ data: usuario });
    } catch (error) {
      next(error);
    }
  };

  reportes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportes = await this.obtenerReportesUseCase.ejecutar();
      res.status(200).json({ data: reportes });
    } catch (error) {
      next(error);
    }
  };
}
