import type { Request, Response, NextFunction } from 'express';
import type {
  AccionAuditoria,
  EntidadAuditoria,
  IAuditoriaRepository,
} from '@domain/auditoria/ports/IAuditoriaRepository.js';
import { logger } from '../logger.js';

/** Extrae el id del recurso desde `{ data: { id } }`, el envelope estándar de respuesta (ADR-018). */
export function idDesdeRespuesta(_req: Request, body: unknown): string | null {
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'id' in data) {
      const id = (data as { id?: unknown }).id;
      return typeof id === 'string' ? id : null;
    }
  }
  return null;
}

/** Extrae el id del recurso desde un parámetro de ruta (ej. DELETE /donaciones/:id, sin cuerpo de respuesta). */
export function idDesdeParametro(nombre: string) {
  return (req: Request): string | null => req.params[nombre] ?? null;
}

/** POST /solicitudes/:id/ofertas responde con la Solicitud completa (no la Oferta sola) — extrae el id
 * de la oferta recién ACEPTADA dentro de `data.ofertas[]` para auditar `APROBAR Oferta` (Fase 9, sección 3). */
export function idDeOfertaAceptada(_req: Request, body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('data' in body)) return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== 'object' || !('ofertas' in data)) return null;
  const ofertas = (data as { ofertas?: unknown }).ofertas;
  if (!Array.isArray(ofertas)) return null;
  const activa = ofertas.find((o) => o && typeof o === 'object' && (o as { estado?: unknown }).estado === 'ACEPTADA');
  const id = activa && typeof activa === 'object' ? (activa as { id?: unknown }).id : null;
  return typeof id === 'string' ? id : null;
}

const ACCIONES_MODERACION_AUDITADAS: readonly AccionAuditoria[] = ['APROBAR', 'BLOQUEAR', 'ELIMINAR'];

/** Endpoints `PATCH /admin/.../:id/moderar` (Fase 4, BC-Administración) cubren 3 acciones distintas
 * en una sola ruta según `req.body.accion` — registra un middleware condicional por cada una
 * (mismo patrón que el parámetro `debeAuditar` de abajo, aplicado 3 veces). */
export function crearAuditMiddlewaresModeracion(
  auditoriaRepository: IAuditoriaRepository,
  entidad: EntidadAuditoria,
) {
  return ACCIONES_MODERACION_AUDITADAS.map((accion) =>
    crearAuditMiddleware(auditoriaRepository, accion, entidad, idDesdeParametro('id'), (req) => req.body?.accion === accion),
  );
}

/** Registra acciones sensibles después de una respuesta exitosa (Fase 9, sección 3, RNF-006).
 * Post-hoc: no bloquea ni puede fallar la respuesta al cliente — un error al auditar solo se loguea. */
export function crearAuditMiddleware(
  auditoriaRepository: IAuditoriaRepository,
  accion: AccionAuditoria,
  entidad: EntidadAuditoria,
  extraerIdEntidad: (req: Request, body: unknown) => string | null,
  /** Opcional — permite auditar condicionalmente cuando una ruta cubre más de una acción
   * (ej. PATCH /solicitudes/:id sirve tanto para editar como para cancelar, sección 3 solo audita esta última). */
  debeAuditar?: (req: Request) => boolean,
) {
  return function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
    const jsonOriginal = res.json.bind(res);
    res.json = ((body: unknown) => {
      res.locals.auditoriaBody = body;
      return jsonOriginal(body);
    }) as typeof res.json;

    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      if (debeAuditar && !debeAuditar(req)) return;
      const idEntidad = extraerIdEntidad(req, res.locals.auditoriaBody);
      if (!idEntidad) return;
      auditoriaRepository
        .registrar({ idUsuario: req.usuario?.sub ?? null, accion, entidad, idEntidad })
        .catch((err) => logger.error({ err }, 'Error al registrar auditoría'));
    });

    next();
  };
}
