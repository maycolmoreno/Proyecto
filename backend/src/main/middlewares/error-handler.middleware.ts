import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { CorreoYaRegistradoError } from '../../modules/identidad/application/use-cases/RegistrarUsuarioUseCase.js';
import {
  CredencialesInvalidasError,
  UsuarioInactivoError,
} from '../../modules/identidad/application/use-cases/IniciarSesionUseCase.js';
import { logger } from '../logger.js';

/** Envelope de error único (Fase 4, ADR-018). Mensajes en español, claros y accionables (RNF-015). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandlerMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Datos de entrada inválidos.', details: err.flatten() },
    });
    return;
  }

  if (err instanceof CorreoYaRegistradoError) {
    res.status(409).json({ error: { code: 'CONFLICT', message: err.message } });
    return;
  }

  if (err instanceof CredencialesInvalidasError) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: err.message } });
    return;
  }

  if (err instanceof UsuarioInactivoError) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: err.message } });
    return;
  }

  // Condición de carrera en el registro (dos peticiones simultáneas con el mismo correo) —
  // el UNIQUE de Postgres la atrapa aunque el caso de uso ya validó antes.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'El recurso ya existe.' } });
    return;
  }

  logger.error({ err }, 'Error no controlado');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado.' } });
}
