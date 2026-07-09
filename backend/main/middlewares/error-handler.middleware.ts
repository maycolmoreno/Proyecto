import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { CorreoYaRegistradoError } from '@application/identidad/use-cases/RegistrarUsuarioUseCase.js';
import {
  CredencialesInvalidasError,
  UsuarioInactivoError,
} from '@application/identidad/use-cases/IniciarSesionUseCase.js';
import { UsuarioNoEncontradoError } from '@application/identidad/use-cases/ObtenerPerfilUseCase.js';
import { CategoriaYaExisteError } from '@application/categorias/use-cases/CrearCategoriaUseCase.js';
import { CategoriaNoEncontradaError } from '@application/categorias/use-cases/ActualizarCategoriaUseCase.js';
import { CategoriaInvalidaError } from '@application/donaciones/use-cases/PublicarDonacionUseCase.js';
import { DonacionNoEncontradaError } from '@application/donaciones/use-cases/ObtenerDonacionUseCase.js';
import { NoEsDueñoDeLaDonacionError } from '@application/donaciones/use-cases/ActualizarDonacionUseCase.js';
import { DonacionYaFinalizadaError } from '@domain/donaciones/entities/Donacion.js';
import { ArchivoInvalidoError } from '@domain/donaciones/ports/ICloudStorage.js';
import { CloudinaryNoConfiguradoError } from '@adapters/donaciones/external/CloudinariaAdapter.js';
import { CategoriaInvalidaError as CategoriaInvalidaSolicitudError } from '@application/solicitudes/use-cases/CrearSolicitudUseCase.js';
import { SolicitudNoEncontradaError } from '@application/solicitudes/use-cases/ObtenerSolicitudUseCase.js';
import { NoEsDueñoDeLaSolicitudError } from '@application/solicitudes/use-cases/ActualizarSolicitudUseCase.js';
import {
  NoPuedeOfertarSobrePropiaSolicitudError,
  DonacionInvalidaParaOfertaError,
  NoEsDueñoDeLaDonacionOfrecidaError,
} from '@application/solicitudes/use-cases/CrearOfertaUseCase.js';
import {
  SolicitudYaFinalizadaError,
  SolicitudNoAceptaOfertasError,
  OfertaDuplicadaError,
  OfertaNoEncontradaEnSolicitudError,
  OfertaYaRechazadaError,
} from '@domain/solicitudes/entities/Solicitud.js';
import {
  EntregaNoEncontradaError,
  NoAutorizadoParaLaEntregaError,
} from '@application/entregas/use-cases/ObtenerEntregaUseCase.js';
import { EntregaYaFinalizadaError } from '@domain/entregas/entities/Entrega.js';
import { CategoriaInvalidaError as CategoriaInvalidaTruequeError } from '@application/trueques/use-cases/PublicarTruequeUseCase.js';
import { TruequeNoEncontradoError } from '@application/trueques/use-cases/ObtenerTruequeUseCase.js';
import { NoEsDueñoDelTruequeError } from '@application/trueques/use-cases/ActualizarTruequeUseCase.js';
import {
  NoPuedeProponerSobrePropioTruequeError,
  TruequeOfrecidoInvalidoError,
  NoEsDueñoDelTruequeOfrecidoError,
  OrigenIgualAOfrecidoError,
} from '@application/trueques/use-cases/ProponerTruequeUseCase.js';
import { NoEsDueñoDelTruequeOrigenError } from '@application/trueques/use-cases/ResponderPropuestaUseCase.js';
import {
  TruequeYaFinalizadoError,
  TruequeNoAceptaPropuestasError,
  PropuestaDuplicadaError,
  PropuestaNoEncontradaEnTruequeError,
  PropuestaYaRechazadaError,
  PropuestaYaAceptadaError,
} from '@domain/trueques/entities/Trueque.js';
import { IAProviderNoConfiguradoError } from '@adapters/ia/external/ClaudeAdapter.js';
import { EntidadInvalidaParaMatchingError } from '@domain/ia/services/MatchingService.js';
import {
  ConversacionNoEncontradaError,
  NoEsDueñoDeLaConversacionError,
} from '@domain/ia/services/ChatbotOrquestacionService.js';
import { UsuarioYaEliminadoError } from '@domain/identidad/entities/Usuario.js';
import {
  PublicacionNoEncontradaParaModerarError,
  UsuarioNoEncontradoParaModerarError,
} from '@domain/administracion/services/ModeracionService.js';
import { NoEsParticipanteError } from '@domain/mensajeria/entities/Conversacion.js';
import {
  DestinatarioInvalidoError,
  NoPuedeEnviarseMensajeAsiMismoError,
} from '@application/mensajeria/use-cases/EnviarMensajeUseCase.js';
import { ConversacionNoEncontradaError as ConversacionMensajeriaNoEncontradaError } from '@application/mensajeria/use-cases/ListarMensajesUseCase.js';
import { NotificacionNoEncontradaError } from '@application/notificaciones/use-cases/MarcarLeidoUseCase.js';
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

  if (
    err instanceof UsuarioNoEncontradoError ||
    err instanceof DonacionNoEncontradaError ||
    err instanceof SolicitudNoEncontradaError ||
    err instanceof OfertaNoEncontradaEnSolicitudError ||
    err instanceof EntregaNoEncontradaError ||
    err instanceof TruequeNoEncontradoError ||
    err instanceof PropuestaNoEncontradaEnTruequeError ||
    err instanceof ConversacionNoEncontradaError ||
    err instanceof EntidadInvalidaParaMatchingError ||
    err instanceof PublicacionNoEncontradaParaModerarError ||
    err instanceof UsuarioNoEncontradoParaModerarError ||
    err instanceof DestinatarioInvalidoError ||
    err instanceof ConversacionMensajeriaNoEncontradaError ||
    err instanceof NotificacionNoEncontradaError
  ) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
    return;
  }

  if (err instanceof CategoriaNoEncontradaError) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
    return;
  }

  if (err instanceof CategoriaYaExisteError) {
    res.status(409).json({ error: { code: 'CONFLICT', message: err.message } });
    return;
  }

  if (
    err instanceof CategoriaInvalidaError ||
    err instanceof CategoriaInvalidaSolicitudError ||
    err instanceof CategoriaInvalidaTruequeError ||
    err instanceof ArchivoInvalidoError ||
    err instanceof DonacionInvalidaParaOfertaError ||
    err instanceof NoPuedeOfertarSobrePropiaSolicitudError ||
    err instanceof NoPuedeProponerSobrePropioTruequeError ||
    err instanceof TruequeOfrecidoInvalidoError ||
    err instanceof OrigenIgualAOfrecidoError ||
    err instanceof NoPuedeEnviarseMensajeAsiMismoError
  ) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
    return;
  }

  if (
    err instanceof NoEsDueñoDeLaDonacionError ||
    err instanceof NoEsDueñoDeLaSolicitudError ||
    err instanceof NoEsDueñoDeLaDonacionOfrecidaError ||
    err instanceof NoAutorizadoParaLaEntregaError ||
    err instanceof NoEsDueñoDelTruequeError ||
    err instanceof NoEsDueñoDelTruequeOfrecidoError ||
    err instanceof NoEsDueñoDelTruequeOrigenError ||
    err instanceof NoEsDueñoDeLaConversacionError ||
    err instanceof NoEsParticipanteError
  ) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: err.message } });
    return;
  }

  if (err instanceof OfertaDuplicadaError || err instanceof PropuestaDuplicadaError || err instanceof PropuestaYaAceptadaError) {
    res.status(409).json({ error: { code: 'CONFLICT', message: err.message } });
    return;
  }

  if (
    err instanceof DonacionYaFinalizadaError ||
    err instanceof SolicitudYaFinalizadaError ||
    err instanceof SolicitudNoAceptaOfertasError ||
    err instanceof OfertaYaRechazadaError ||
    err instanceof EntregaYaFinalizadaError ||
    err instanceof TruequeYaFinalizadoError ||
    err instanceof TruequeNoAceptaPropuestasError ||
    err instanceof PropuestaYaRechazadaError ||
    err instanceof UsuarioYaEliminadoError
  ) {
    res.status(422).json({ error: { code: 'UNPROCESSABLE', message: err.message } });
    return;
  }

  if (err instanceof CloudinaryNoConfiguradoError || err instanceof IAProviderNoConfiguradoError) {
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: err.message } });
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
