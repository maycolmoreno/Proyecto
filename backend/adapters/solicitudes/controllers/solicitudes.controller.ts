import type { Request, Response, NextFunction } from 'express';
import {
  crearSolicitudSchema,
  actualizarSolicitudSchema,
  listarSolicitudesQuerySchema,
  crearOfertaSchema,
} from './schemas.js';
import type { CrearSolicitudUseCase } from '@application/solicitudes/use-cases/CrearSolicitudUseCase.js';
import type { ListarSolicitudesUseCase } from '@application/solicitudes/use-cases/ListarSolicitudesUseCase.js';
import type { ObtenerSolicitudUseCase } from '@application/solicitudes/use-cases/ObtenerSolicitudUseCase.js';
import type { ActualizarSolicitudUseCase } from '@application/solicitudes/use-cases/ActualizarSolicitudUseCase.js';
import type { CrearOfertaUseCase } from '@application/solicitudes/use-cases/CrearOfertaUseCase.js';
import type { ActualizarOfertaUseCase } from '@application/solicitudes/use-cases/ActualizarOfertaUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class SolicitudesController {
  constructor(
    private readonly crearSolicitud: CrearSolicitudUseCase,
    private readonly listarSolicitudes: ListarSolicitudesUseCase,
    private readonly obtenerSolicitud: ObtenerSolicitudUseCase,
    private readonly actualizarSolicitud: ActualizarSolicitudUseCase,
    private readonly crearOferta: CrearOfertaUseCase,
    private readonly actualizarOferta: ActualizarOfertaUseCase,
  ) {}

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = crearSolicitudSchema.parse(req.body);
      const solicitud = await this.crearSolicitud.ejecutar({ ...input, beneficiarioId: req.usuario!.sub });
      res.status(201).json({ data: solicitud });
    } catch (error) {
      next(error);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sort, ...filtros } = listarSolicitudesQuerySchema.parse(req.query);
      const solicitante = req.usuario ? { id: req.usuario.sub, rol: req.usuario.rol } : undefined;
      const resultado = await this.listarSolicitudes.ejecutar({ filtros: { ...filtros, sort }, page, limit, solicitante });
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const solicitante = req.usuario ? { id: req.usuario.sub, rol: req.usuario.rol } : undefined;
      const solicitud = await this.obtenerSolicitud.ejecutar(req.params.id!, solicitante);
      res.status(200).json({ data: solicitud });
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = actualizarSolicitudSchema.parse(req.body);
      const solicitud = await this.actualizarSolicitud.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(200).json({ data: solicitud });
    } catch (error) {
      next(error);
    }
  };

  crearOfertaHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = crearOfertaSchema.parse(req.body);
      const solicitud = await this.crearOferta.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(201).json({ data: solicitud });
    } catch (error) {
      next(error);
    }
  };

  actualizarOfertaHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const solicitud = await this.actualizarOferta.ejecutar(req.params.id!, req.params.ofertaId!, {
        id: req.usuario!.sub,
        rol: req.usuario!.rol,
      });
      res.status(200).json({ data: solicitud });
    } catch (error) {
      next(error);
    }
  };
}
