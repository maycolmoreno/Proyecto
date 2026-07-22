import type { Request, Response, NextFunction } from 'express';
import {
  crearDonacionSchema,
  actualizarDonacionSchema,
  listarDonacionesQuerySchema,
  firmarImagenSchema,
  registrarImagenSchema,
  crearReservaSchema,
  responderReservaSchema,
} from './schemas.js';
import type { PublicarDonacionUseCase } from '@application/donaciones/use-cases/PublicarDonacionUseCase.js';
import type { ListarDonacionesUseCase } from '@application/donaciones/use-cases/ListarDonacionesUseCase.js';
import type { ObtenerDonacionUseCase } from '@application/donaciones/use-cases/ObtenerDonacionUseCase.js';
import type { ActualizarDonacionUseCase } from '@application/donaciones/use-cases/ActualizarDonacionUseCase.js';
import type { CancelarDonacionUseCase } from '@application/donaciones/use-cases/CancelarDonacionUseCase.js';
import type { FirmarSubidaImagenUseCase } from '@application/donaciones/use-cases/FirmarSubidaImagenUseCase.js';
import type { RegistrarImagenUseCase } from '@application/donaciones/use-cases/RegistrarImagenUseCase.js';
import type { CrearReservaUseCase } from '@application/donaciones/use-cases/CrearReservaUseCase.js';
import type { ResponderReservaUseCase } from '@application/donaciones/use-cases/ResponderReservaUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class DonacionesController {
  constructor(
    private readonly publicarDonacion: PublicarDonacionUseCase,
    private readonly listarDonaciones: ListarDonacionesUseCase,
    private readonly obtenerDonacion: ObtenerDonacionUseCase,
    private readonly actualizarDonacion: ActualizarDonacionUseCase,
    private readonly cancelarDonacion: CancelarDonacionUseCase,
    private readonly firmarSubidaImagen: FirmarSubidaImagenUseCase,
    private readonly registrarImagen: RegistrarImagenUseCase,
    private readonly crearReserva: CrearReservaUseCase,
    private readonly responderReserva: ResponderReservaUseCase,
  ) {}

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = crearDonacionSchema.parse(req.body);
      const donacion = await this.publicarDonacion.ejecutar({ ...input, donanteId: req.usuario!.sub });
      res.status(201).json({ data: donacion });
    } catch (error) {
      next(error);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sort, ...filtros } = listarDonacionesQuerySchema.parse(req.query);
      const solicitante = req.usuario ? { id: req.usuario.sub, rol: req.usuario.rol } : undefined;
      const resultado = await this.listarDonaciones.ejecutar({ filtros: { ...filtros, sort }, page, limit, solicitante });
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const solicitante = req.usuario ? { id: req.usuario.sub, rol: req.usuario.rol } : undefined;
      const donacion = await this.obtenerDonacion.ejecutar(req.params.id!, solicitante);
      res.status(200).json({ data: donacion });
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = actualizarDonacionSchema.parse(req.body);
      const donacion = await this.actualizarDonacion.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(200).json({ data: donacion });
    } catch (error) {
      next(error);
    }
  };

  cancelar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cancelarDonacion.ejecutar(req.params.id!, { id: req.usuario!.sub, rol: req.usuario!.rol });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  firmarImagen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = firmarImagenSchema.parse(req.body);
      const firma = await this.firmarSubidaImagen.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(200).json({ data: firma });
    } catch (error) {
      next(error);
    }
  };

  registrarImagenSubida = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = registrarImagenSchema.parse(req.body);
      const imagenes = await this.registrarImagen.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(201).json({ data: { imagenes } });
    } catch (error) {
      next(error);
    }
  };

  crearReservaHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = crearReservaSchema.parse(req.body);
      const donacion = await this.crearReserva.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(201).json({ data: donacion });
    } catch (error) {
      next(error);
    }
  };

  responderReservaHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = responderReservaSchema.parse(req.body);
      const donacion = await this.responderReserva.ejecutar(
        req.params.id!,
        req.params.reservaId!,
        req.usuario!.sub,
        input,
      );
      res.status(200).json({ data: donacion });
    } catch (error) {
      next(error);
    }
  };
}
