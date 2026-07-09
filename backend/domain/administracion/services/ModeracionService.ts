import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import type { UsuarioPublico } from '@domain/identidad/entities/Usuario.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { DonacionResponse } from '@domain/donaciones/entities/Donacion.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { TruequeResponse } from '@domain/trueques/entities/Trueque.js';
import type { IAnalisisIARepository, AnalisisIA, TipoEntidadIA } from '@domain/ia/ports/IAnalisisIARepository.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

export const ACCIONES_MODERACION = ['APROBAR', 'BLOQUEAR', 'ELIMINAR'] as const;
export type AccionModeracion = (typeof ACCIONES_MODERACION)[number];

export type PublicacionModerada = DonacionResponse | SolicitudResponse | TruequeResponse;

export class PublicacionNoEncontradaParaModerarError extends Error {
  constructor() {
    super('La publicación indicada no existe.');
    this.name = 'PublicacionNoEncontradaParaModerarError';
  }
}

export class UsuarioNoEncontradoParaModerarError extends Error {
  constructor() {
    super('El usuario indicado no existe.');
    this.name = 'UsuarioNoEncontradoParaModerarError';
  }
}

/** Domain Service (Fase 2, sección 6) — BC-Administración → Identidad/Donaciones/Solicitudes/Trueques
 * vía "Anti-corrupción/operación directa autorizada" (Fase 2, sección 2). RF-018/CU-011.
 *
 * `BLOQUEAR` y `ELIMINAR` sobre publicaciones (Donación/Solicitud/Trueque) transicionan al mismo
 * estado terminal `CANCELADA`/`CANCELADO` ya existente (reutiliza `cancelar()`): el modelo físico
 * aprobado en Fase 3 no define un estado `BLOQUEADA` independiente para estas tablas (a diferencia
 * de `usuarios`, que sí distingue `SUSPENDIDO`/`ELIMINADO`) y esta capacidad es "Should have"
 * (ADR-027) — se documenta como decisión de Sprint 4 en docs/fases/fase-06-backend.md historial.
 * `APROBAR` sobre una publicación no cambia su estado (solo queda auditado como revisión humana). */
export class ModeracionService {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly donacionRepository: IDonacionRepository,
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly truequeRepository: ITruequeRepository,
    private readonly analisisRepository: IAnalisisIARepository,
    private readonly eventBus: IEventBus,
  ) {}

  async moderarPublicacion(
    tipoEntidad: TipoEntidadIA,
    id: string,
    accion: AccionModeracion,
  ): Promise<PublicacionModerada> {
    if (tipoEntidad === 'DONACION') {
      const donacion = await this.donacionRepository.buscarPorId(id);
      if (!donacion) throw new PublicacionNoEncontradaParaModerarError();
      if (accion !== 'APROBAR') {
        donacion.cancelar();
        await this.donacionRepository.actualizar(donacion);
      }
      this.eventBus.emit('PublicacionModerada', { tipoEntidad, entidadId: id, accion });
      return donacion.toJSON({ incluirUbicacionExacta: true });
    }

    if (tipoEntidad === 'SOLICITUD') {
      const solicitud = await this.solicitudRepository.buscarPorId(id);
      if (!solicitud) throw new PublicacionNoEncontradaParaModerarError();
      if (accion !== 'APROBAR') {
        solicitud.cancelar();
        await this.solicitudRepository.actualizar(solicitud);
      }
      this.eventBus.emit('PublicacionModerada', { tipoEntidad, entidadId: id, accion });
      return solicitud.toJSON({ incluirUbicacionExacta: true, esAdmin: true });
    }

    const trueque = await this.truequeRepository.buscarPorId(id);
    if (!trueque) throw new PublicacionNoEncontradaParaModerarError();
    if (accion !== 'APROBAR') {
      trueque.cancelar();
      await this.truequeRepository.actualizar(trueque);
    }
    this.eventBus.emit('PublicacionModerada', { tipoEntidad, entidadId: id, accion });
    return trueque.toJSON({ esAdmin: true });
  }

  async moderarUsuario(id: string, accion: AccionModeracion): Promise<UsuarioPublico> {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) throw new UsuarioNoEncontradoParaModerarError();

    if (accion === 'APROBAR') usuario.activar();
    else if (accion === 'BLOQUEAR') usuario.suspender();
    else usuario.eliminar();

    await this.usuarioRepository.actualizar(usuario);
    return usuario.toJSON();
  }

  async obtenerReportes(): Promise<AnalisisIA[]> {
    return this.analisisRepository.listarConRiesgo();
  }
}
