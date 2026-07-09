import type { Request, Response, NextFunction } from 'express';
import { enviarMensajeSchema } from './schemas.js';
import type { EnviarMensajeUseCase } from '@application/mensajeria/use-cases/EnviarMensajeUseCase.js';
import type { ListarConversacionesUseCase } from '@application/mensajeria/use-cases/ListarConversacionesUseCase.js';
import type { ListarMensajesUseCase } from '@application/mensajeria/use-cases/ListarMensajesUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class MensajeriaController {
  constructor(
    private readonly enviarMensajeUseCase: EnviarMensajeUseCase,
    private readonly listarConversacionesUseCase: ListarConversacionesUseCase,
    private readonly listarMensajesUseCase: ListarMensajesUseCase,
  ) {}

  listarConversaciones = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversaciones = await this.listarConversacionesUseCase.ejecutar(req.usuario!.sub);
      res.status(200).json({ data: conversaciones });
    } catch (error) {
      next(error);
    }
  };

  listarMensajes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversacion = await this.listarMensajesUseCase.ejecutar(req.usuario!.sub, req.params.id!);
      res.status(200).json({ data: conversacion });
    } catch (error) {
      next(error);
    }
  };

  enviarMensaje = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = enviarMensajeSchema.parse(req.body);
      const conversacion = await this.enviarMensajeUseCase.ejecutar({
        autorId: req.usuario!.sub,
        destinatarioId: req.params.id!,
        texto: input.texto,
      });
      res.status(201).json({ data: conversacion });
    } catch (error) {
      next(error);
    }
  };
}
