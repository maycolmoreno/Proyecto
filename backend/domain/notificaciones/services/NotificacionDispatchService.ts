import type { INotificacionRepository } from '../ports/INotificacionRepository.js';
import type { IEventoSistemaRepository } from '../ports/IEventoSistemaRepository.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import type { TipoOperacionEntrega } from '@domain/entregas/value-objects/TipoOperacionEntrega.js';
import type { TipoEntidadIA } from '@domain/ia/ports/IAnalisisIARepository.js';

/** Domain Service (Fase 2, sección 6) — "Reacciona a eventos de dominio y decide qué notificar"
 * (RF-020). Segundo listener real del Event Bus (el primero fue `ModeracionIAService`, Sprint 4):
 * se registra en el composition root sobre los 12 eventos de dominio de Fase 6 sección 5 más
 * `RiesgoDetectado` (Sprint 4). Un método por evento — cada `eventBus.on(...)` en di-container.ts
 * llama al método correspondiente, mismo patrón que ModeracionIAService.
 *
 * **Solo canal in-app** (`INotificacionRepository`) — el canal de correo vía n8n (Fase 8,
 * ADR-028/029/030/031) se removió del proyecto (decisión del usuario, 2026-07-10): la
 * configuración manual del workflow en la UI de n8n (credenciales SMTP, nodos Switch/Set/Send
 * Email) nunca se completó, y se optó por eliminar la integración en vez de dejarla a medio
 * construir. `IWebhookNotifier`/`N8nWebhookAdapter`/`ILogsN8nRepository` y el servicio `n8n` de
 * `docker-compose.yml` se eliminaron junto con esta simplificación — ver
 * `docs/fases/fase-08-automatizaciones.md` (marcada como removida) y `docs/PLAN_FRONTEND.md`.
 *
 * Para `EntregaProgramada`/`EntregaConfirmada`/`PublicacionModerada`, resolver el destinatario exige
 * cruzar a Donaciones/Solicitudes/Trueques — misma necesidad que `EntregaAutorizacionService`
 * (capa `application`), pero un Domain Service no puede depender de `application/` (regla de
 * dependencia, Fase 6 sección 1); se duplica aquí la resolución mínima en vez de importarla. */
export class NotificacionDispatchService {
  constructor(
    private readonly notificacionRepository: INotificacionRepository,
    private readonly eventoSistemaRepository: IEventoSistemaRepository,
    private readonly donacionRepository: IDonacionRepository,
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly truequeRepository: ITruequeRepository,
    private readonly usuarioRepository: IUsuarioRepository,
  ) {}

  /** `entidadTipo` (extensión post-cierre, ver docs/PLAN_FRONTEND.md) — persiste el discriminador de
   * dominio junto a `entidadRelacionada` para que el frontend pueda navegar al hacer click en una
   * notificación (ej. "DONACION" + id → `/donaciones/:id`). Antes de esta extensión solo se
   * guardaba el id, ambiguo para `PublicacionModerada`/`RiesgoDetectado` (la misma notificación
   * puede referirse a una Donación, Solicitud o Trueque). */
  private notificar(
    usuarioId: string,
    tipo: string,
    entidadTipo: string | null,
    entidadRelacionada: string | null,
    mensaje: string,
  ): void {
    this.notificacionRepository
      .crear({ usuarioId, tipo, entidadTipo, entidadRelacionada, mensaje, canal: 'app' })
      .catch(() => undefined);
  }

  async alUsuarioRegistrado(payload: { id: string; nombre: string }): Promise<void> {
    this.notificar(payload.id, 'UsuarioRegistrado', null, null, `¡Bienvenido/a a DonaConnect, ${payload.nombre}!`);
  }

  async alDonacionPublicada(payload: { id: string; titulo: string; donanteId: string }): Promise<void> {
    this.notificar(payload.donanteId, 'DonacionPublicada', 'DONACION', payload.id, `Tu donación "${payload.titulo}" fue publicada.`);
  }

  async alOfertaRecibida(payload: { solicitudId: string; beneficiarioId: string }): Promise<void> {
    this.notificar(payload.beneficiarioId, 'OfertaRecibida', 'SOLICITUD', payload.solicitudId, 'Recibiste una oferta para tu solicitud.');
  }

  async alSolicitudAceptadaPorDonante(payload: { id: string; beneficiarioId: string }): Promise<void> {
    this.notificar(payload.beneficiarioId, 'SolicitudAceptadaPorDonante', 'SOLICITUD', payload.id, 'Un donante aceptó tu solicitud.');
  }

  async alSolicitudAtendida(payload: { id: string; beneficiarioId: string }): Promise<void> {
    this.notificar(payload.beneficiarioId, 'SolicitudAtendida', 'SOLICITUD', payload.id, 'Tu solicitud fue atendida completamente.');
    await this.registrarEventoKpi('SolicitudAtendida', 'SOLICITUD', payload.id, payload.beneficiarioId);
  }

  async alTruequePublicado(payload: { id: string; titulo: string; usuarioId: string }): Promise<void> {
    this.notificar(payload.usuarioId, 'TruequePublicado', 'TRUEQUE', payload.id, `Tu trueque "${payload.titulo}" fue publicado.`);
  }

  async alPropuestaTruequeRecibida(payload: { truequeOrigenId: string; dueñoOrigenId: string }): Promise<void> {
    this.notificar(
      payload.dueñoOrigenId,
      'PropuestaTruequeRecibida',
      'TRUEQUE',
      payload.truequeOrigenId,
      'Recibiste una propuesta de trueque.',
    );
  }

  async alTruequeAceptadoBilateralmente(payload: {
    truequeOrigenId: string;
    dueñoOrigenId: string;
    proponenteId: string;
  }): Promise<void> {
    this.notificar(payload.dueñoOrigenId, 'TruequeAceptadoBilateralmente', 'TRUEQUE', payload.truequeOrigenId, 'Tu trueque fue aceptado.');
    this.notificar(
      payload.proponenteId,
      'TruequeAceptadoBilateralmente',
      'TRUEQUE',
      payload.truequeOrigenId,
      'Tu propuesta de trueque fue aceptada.',
    );
  }

  async alTruequeIntercambiado(payload: { id: string; usuarioId: string }): Promise<void> {
    this.notificar(payload.usuarioId, 'TruequeIntercambiado', 'TRUEQUE', payload.id, 'Tu trueque se completó exitosamente.');
    await this.registrarEventoKpi('TruequeIntercambiado', 'TRUEQUE', payload.id, payload.usuarioId);
  }

  /** `idReferencia` (extensión post-cierre, ver docs/PLAN_FRONTEND.md) es el id de la
   * Donación/Trueque ORIGEN — antes solo se recibía el id de la propia Entrega, que no sirve para
   * `resolverPartesOrigen` (bug real: nunca resolvía ninguna parte, así que esta notificación
   * nunca se generaba) ni para navegar desde el frontend (no hay ruta `/entregas/:id`). */
  async alEntregaProgramada(payload: { id: string; idReferencia: string; tipoOperacion: TipoOperacionEntrega }): Promise<void> {
    const partes = await this.resolverPartesOrigen(payload.tipoOperacion, payload.idReferencia);
    for (const usuarioId of partes) {
      this.notificar(usuarioId, 'EntregaProgramada', payload.tipoOperacion, payload.idReferencia, 'Se programó una entrega/retiro.');
    }
  }

  async alEntregaConfirmada(payload: { id: string; idReferencia: string; tipoOperacion: TipoOperacionEntrega }): Promise<void> {
    const partes = await this.resolverPartesOrigen(payload.tipoOperacion, payload.idReferencia);
    for (const usuarioId of partes) {
      this.notificar(usuarioId, 'EntregaConfirmada', payload.tipoOperacion, payload.idReferencia, 'Tu entrega fue confirmada.');
    }
    await this.registrarEventoKpi('EntregaConfirmada', 'ENTREGA', payload.id, partes[0] ?? null);
  }

  async alPublicacionModerada(payload: { tipoEntidad: TipoEntidadIA; entidadId: string; accion: string }): Promise<void> {
    const propietarioId = await this.resolverPropietarioPublicacion(payload.tipoEntidad, payload.entidadId);
    if (!propietarioId) return;
    this.notificar(
      propietarioId,
      'PublicacionModerada',
      payload.tipoEntidad,
      payload.entidadId,
      `Tu publicación fue moderada (${payload.accion.toLowerCase()}).`,
    );
  }

  async alRiesgoDetectado(payload: { tipoEntidad: TipoEntidadIA; entidadId: string }): Promise<void> {
    const administradores = await this.usuarioRepository.listarPorRol('ADMINISTRADOR');
    for (const admin of administradores) {
      this.notificar(admin.id, 'RiesgoDetectado', payload.tipoEntidad, payload.entidadId, 'Una publicación fue marcada con riesgo por IA.');
    }
  }

  /** Fase 6, sección 5 — solo estos 3 eventos "de cierre positivo" alimentan `eventos_sistema`
   * (dashboard de impacto, CU-012), a diferencia de los 12+1 que sí generan notificación in-app. */
  private async registrarEventoKpi(
    tipoEvento: string,
    entidad: string,
    referenciaId: string,
    usuarioId: string | null,
  ): Promise<void> {
    await this.eventoSistemaRepository.registrar({ usuarioId, tipoEvento, entidad, referenciaId }).catch(() => undefined);
  }

  /** `entrega.idReferencia` apunta a la Donación o al Trueque ORIGEN (ADR-015, mismo patrón que
   * EntregaAutorizacionService, capa application). */
  private async resolverPartesOrigen(tipoOperacion: TipoOperacionEntrega, idReferencia: string): Promise<string[]> {
    if (tipoOperacion === 'DONACION') {
      const [donacion, solicitud] = await Promise.all([
        this.donacionRepository.buscarPorId(idReferencia),
        this.solicitudRepository.buscarPorOfertaDonacionAceptada(idReferencia),
      ]);
      return [donacion?.donanteId, solicitud?.beneficiarioId].filter((id): id is string => !!id);
    }

    const truequeOrigen = await this.truequeRepository.buscarPorId(idReferencia);
    if (!truequeOrigen) return [];
    const propuestaAceptada = truequeOrigen.propuestasRecibidas.find((p) => p.estado === 'ACEPTADA');
    return [truequeOrigen.usuarioId, propuestaAceptada?.usuarioProponenteId].filter((id): id is string => !!id);
  }

  private async resolverPropietarioPublicacion(tipoEntidad: TipoEntidadIA, id: string): Promise<string | null> {
    if (tipoEntidad === 'DONACION') return (await this.donacionRepository.buscarPorId(id))?.donanteId ?? null;
    if (tipoEntidad === 'SOLICITUD') return (await this.solicitudRepository.buscarPorId(id))?.beneficiarioId ?? null;
    return (await this.truequeRepository.buscarPorId(id))?.usuarioId ?? null;
  }
}
