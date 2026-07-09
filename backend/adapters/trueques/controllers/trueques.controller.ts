import type { Request, Response, NextFunction } from 'express';
import {
  crearTruequeSchema,
  actualizarTruequeSchema,
  listarTruequesQuerySchema,
  proponerTruequeSchema,
  responderPropuestaSchema,
  firmarImagenSchema,
  registrarImagenSchema,
} from './schemas.js';
import type { PublicarTruequeUseCase } from '@application/trueques/use-cases/PublicarTruequeUseCase.js';
import type { ListarTruequesUseCase } from '@application/trueques/use-cases/ListarTruequesUseCase.js';
import type { ObtenerTruequeUseCase } from '@application/trueques/use-cases/ObtenerTruequeUseCase.js';
import type { ActualizarTruequeUseCase } from '@application/trueques/use-cases/ActualizarTruequeUseCase.js';
import type { ProponerTruequeUseCase } from '@application/trueques/use-cases/ProponerTruequeUseCase.js';
import type { ResponderPropuestaUseCase } from '@application/trueques/use-cases/ResponderPropuestaUseCase.js';
import type { FirmarSubidaImagenUseCase } from '@application/trueques/use-cases/FirmarSubidaImagenUseCase.js';
import type { RegistrarImagenUseCase } from '@application/trueques/use-cases/RegistrarImagenUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class TruequesController {
  constructor(
    private readonly publicarTrueque: PublicarTruequeUseCase,
    private readonly listarTrueques: ListarTruequesUseCase,
    private readonly obtenerTrueque: ObtenerTruequeUseCase,
    private readonly actualizarTrueque: ActualizarTruequeUseCase,
    private readonly proponerTrueque: ProponerTruequeUseCase,
    private readonly responderPropuesta: ResponderPropuestaUseCase,
    private readonly firmarSubidaImagen: FirmarSubidaImagenUseCase,
    private readonly registrarImagen: RegistrarImagenUseCase,
  ) {}

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = crearTruequeSchema.parse(req.body);
      const trueque = await this.publicarTrueque.ejecutar({ ...input, usuarioId: req.usuario!.sub });
      res.status(201).json({ data: trueque });
    } catch (error) {
      next(error);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, sort, ...filtros } = listarTruequesQuerySchema.parse(req.query);
      const solicitante = req.usuario ? { id: req.usuario.sub, rol: req.usuario.rol } : undefined;
      const resultado = await this.listarTrueques.ejecutar({ filtros: { ...filtros, sort }, page, limit, solicitante });
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };

  obtener = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const solicitante = req.usuario ? { id: req.usuario.sub, rol: req.usuario.rol } : undefined;
      const trueque = await this.obtenerTrueque.ejecutar(req.params.id!, solicitante);
      res.status(200).json({ data: trueque });
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = actualizarTruequeSchema.parse(req.body);
      const trueque = await this.actualizarTrueque.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(200).json({ data: trueque });
    } catch (error) {
      next(error);
    }
  };

  proponerHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = proponerTruequeSchema.parse(req.body);
      const trueque = await this.proponerTrueque.ejecutar(req.params.id!, req.usuario!.sub, input);
      res.status(201).json({ data: trueque });
    } catch (error) {
      next(error);
    }
  };

  responderPropuestaHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = responderPropuestaSchema.parse(req.body);
      const trueque = await this.responderPropuesta.ejecutar(
        req.params.id!,
        req.params.propuestaId!,
        req.usuario!.sub,
        input,
      );
      res.status(200).json({ data: trueque });
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
}
