import type { IPublicacionIndexRepository } from '../ports/IPublicacionIndexRepository.js';

/** Domain Service (Fase 5 diferida, docs/DISENO_MODELO_PERFILES.md sección 7) — tercer listener
 * real del Event Bus (los primeros dos: ModeracionIAService, NotificacionDispatchService). Un
 * método por evento, mismo patrón. Solo escucha los eventos que afectan directamente el `estado`
 * que esta proyección rastrea (`estadoDonacion`/`estadoSolicitud`/`estadoTrueque`) — no escucha
 * `PublicacionModerada` ni cambios vía PATCH directo (cancelar/actualizar no emiten evento hoy,
 * mismo hueco que ya acepta NotificacionDispatchService para esos flujos); el frontend muestra un
 * aviso de que el estado puede no reflejar cambios muy recientes en vez de ampliar la cobertura de
 * eventos para esto. */
export class PublicacionIndexService {
  constructor(private readonly publicacionIndexRepository: IPublicacionIndexRepository) {}

  async alDonacionPublicada(payload: { id: string; titulo: string; donanteId: string; estadoDonacion: string }): Promise<void> {
    await this.publicacionIndexRepository.indexar({
      id: payload.id,
      tipo: 'DONACION',
      titulo: payload.titulo,
      estado: payload.estadoDonacion,
      usuarioId: payload.donanteId,
    });
  }

  async alSolicitudCreada(payload: { id: string; titulo: string; beneficiarioId: string; estadoSolicitud: string }): Promise<void> {
    await this.publicacionIndexRepository.indexar({
      id: payload.id,
      tipo: 'SOLICITUD',
      titulo: payload.titulo,
      estado: payload.estadoSolicitud,
      usuarioId: payload.beneficiarioId,
    });
  }

  async alTruequePublicado(payload: { id: string; titulo: string; usuarioId: string; estadoTrueque: string }): Promise<void> {
    await this.publicacionIndexRepository.indexar({
      id: payload.id,
      tipo: 'TRUEQUE',
      titulo: payload.titulo,
      estado: payload.estadoTrueque,
      usuarioId: payload.usuarioId,
    });
  }

  async alSolicitudAceptadaPorDonante(payload: { id: string }): Promise<void> {
    await this.publicacionIndexRepository.actualizarEstado(payload.id, 'SOLICITUD', 'ACEPTADA_POR_DONANTE');
  }

  async alSolicitudAtendida(payload: { id: string }): Promise<void> {
    await this.publicacionIndexRepository.actualizarEstado(payload.id, 'SOLICITUD', 'ATENDIDA');
  }

  /** Ambos lados del trueque (origen y ofrecido, dos aggregates/filas distintas) pasan a
   * EN_COORDINACION al aceptar (ResponderPropuestaUseCase.ts) — hay que actualizar los dos. */
  async alTruequeAceptadoBilateralmente(payload: { truequeOrigenId: string; truequeOfrecidoId: string }): Promise<void> {
    await Promise.all([
      this.publicacionIndexRepository.actualizarEstado(payload.truequeOrigenId, 'TRUEQUE', 'EN_COORDINACION'),
      this.publicacionIndexRepository.actualizarEstado(payload.truequeOfrecidoId, 'TRUEQUE', 'EN_COORDINACION'),
    ]);
  }

  async alTruequeIntercambiado(payload: { id: string }): Promise<void> {
    await this.publicacionIndexRepository.actualizarEstado(payload.id, 'TRUEQUE', 'INTERCAMBIADO');
  }
}
