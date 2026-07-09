import type { Entrega } from '../entities/Entrega.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

/** Domain Service (Fase 2, sección 6 — extiende el rol de `EntregaCoordinacionService`: "gestiona
 * una Entrega") — al confirmar una Entrega, transiciona el aggregate ORIGEN a su estado terminal
 * positivo (Donación→`ENTREGADA`, Solicitud→`ATENDIDA`, Trueque→`INTERCAMBIADO` en ambos lados).
 *
 * Cierra el gap detectado en Sprints 2-3 (ver docs/PLAN_IMPLEMENTACION.md y el historial de esta
 * fase, Sprint 5): se resolvió con **cascada síncrona directa** dentro de la misma petición HTTP
 * que confirma la Entrega, **no vía el Event Bus** — a diferencia de la moderación IA (Should-have,
 * Fase 7 sección 5, tolera fallo silencioso por diseño), alcanzar el estado terminal de un flujo
 * Must-have no debe depender de un listener best-effort que puede fallar sin que nadie se entere.
 * Sí emite `SolicitudAtendida`/`TruequeIntercambiado` (Fase 6 sección 5) para que
 * `NotificacionDispatchService`/KPI reaccionen — la persistencia del estado ya está garantizada de
 * forma síncrona antes de emitir. */
export class EntregaCierreOrigenService {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly truequeRepository: ITruequeRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async cerrarOrigen(entrega: Entrega): Promise<void> {
    if (entrega.tipoOperacion === 'DONACION') {
      const donacion = await this.donacionRepository.buscarPorId(entrega.idReferencia);
      if (donacion) {
        donacion.marcarEntregada();
        await this.donacionRepository.actualizar(donacion);
      }

      const solicitud = await this.solicitudRepository.buscarPorOfertaDonacionAceptada(entrega.idReferencia);
      if (solicitud) {
        solicitud.marcarAtendida();
        await this.solicitudRepository.actualizar(solicitud);
        this.eventBus.emit('SolicitudAtendida', { id: solicitud.id, beneficiarioId: solicitud.beneficiarioId });
      }
      return;
    }

    // TRUEQUE: entrega.idReferencia es el trueque ORIGEN (mismo patrón que EntregaAutorizacionService).
    const truequeOrigen = await this.truequeRepository.buscarPorId(entrega.idReferencia);
    if (!truequeOrigen) return;
    truequeOrigen.marcarIntercambiado();
    await this.truequeRepository.actualizar(truequeOrigen);
    this.eventBus.emit('TruequeIntercambiado', { id: truequeOrigen.id, usuarioId: truequeOrigen.usuarioId });

    const propuestaAceptada = truequeOrigen.propuestasRecibidas.find((p) => p.estado === 'ACEPTADA');
    if (!propuestaAceptada) return;
    const truequeOfrecido = await this.truequeRepository.buscarPorId(propuestaAceptada.truequeOfrecidoId);
    if (truequeOfrecido) {
      truequeOfrecido.marcarIntercambiado();
      await this.truequeRepository.actualizar(truequeOfrecido);
      this.eventBus.emit('TruequeIntercambiado', { id: truequeOfrecido.id, usuarioId: truequeOfrecido.usuarioId });
    }
  }
}
