import type { Request, Response, NextFunction } from 'express';
import { chatbotMensajeSchema, clasificarSchema, matchingQuerySchema } from './schemas.js';
import type { ChatearUseCase } from '@application/ia/use-cases/ChatearUseCase.js';
import type { ObtenerConversacionUseCase } from '@application/ia/use-cases/ObtenerConversacionUseCase.js';
import type { ClasificarUseCase } from '@application/ia/use-cases/ClasificarUseCase.js';
import type { ObtenerMatchesUseCase } from '@application/ia/use-cases/ObtenerMatchesUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class IaController {
  constructor(
    private readonly chatearUseCase: ChatearUseCase,
    private readonly obtenerConversacionUseCase: ObtenerConversacionUseCase,
    private readonly clasificarUseCase: ClasificarUseCase,
    private readonly obtenerMatchesUseCase: ObtenerMatchesUseCase,
  ) {}

  chatear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = chatbotMensajeSchema.parse(req.body);
      const resultado = await this.chatearUseCase.ejecutar({ usuarioId: req.usuario!.sub, ...input });
      res.status(200).json({ data: resultado });
    } catch (error) {
      next(error);
    }
  };

  obtenerConversacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversacion = await this.obtenerConversacionUseCase.ejecutar(req.params.id!, req.usuario!.sub);
      res.status(200).json({ data: conversacion });
    } catch (error) {
      next(error);
    }
  };

  clasificar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = clasificarSchema.parse(req.body);
      const resultado = await this.clasificarUseCase.ejecutar(input);
      res.status(200).json({ data: resultado });
    } catch (error) {
      next(error);
    }
  };

  matching = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { entidadTipo, entidadId } = matchingQuerySchema.parse(req.query);
      const resultados = await this.obtenerMatchesUseCase.ejecutar(entidadTipo, entidadId);
      res.status(200).json({ data: resultados });
    } catch (error) {
      next(error);
    }
  };
}
