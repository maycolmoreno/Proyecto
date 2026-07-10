import { Entrega } from '../entities/Entrega.js';
import type { IEntregaRepository } from '../ports/IEntregaRepository.js';
import type { ModalidadEntrega } from '../value-objects/ModalidadEntrega.js';
import type { TipoOperacionEntrega } from '../value-objects/TipoOperacionEntrega.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

export interface CrearEntregaInput {
  id: string;
  tipoOperacion: TipoOperacionEntrega;
  idReferencia: string;
  requiereRetiro: boolean;
}

/** Domain Service (Fase 6, sección 3) — crea la Entrega desde una Oferta/Propuesta aceptada.
 * Se invoca de forma síncrona dentro del caso de uso que acepta (Fase 6, sección 5: "ya invocado
 * en la orquestación síncrona"), no vía el Event Bus. */
export class EntregaCoordinacionService {
  constructor(
    private readonly entregaRepository: IEntregaRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async crear(input: CrearEntregaInput): Promise<Entrega> {
    const modalidad: ModalidadEntrega = input.requiereRetiro ? 'RETIRO_DOMICILIO' : 'ENTREGA_DIRECTA';
    const entrega = Entrega.crear({
      id: input.id,
      tipoOperacion: input.tipoOperacion,
      idReferencia: input.idReferencia,
      modalidad,
    });
    await this.entregaRepository.crear(entrega);
    // Bug real encontrado y corregido (ver docs/PLAN_FRONTEND.md, extensión post-cierre): el payload
    // solo traía `entrega.id` (id de la propia Entrega). `resolverPartesOrigen` en
    // NotificacionDispatchService espera el id de la Donación/Trueque ORIGEN (`idReferencia`), no el
    // de la Entrega — sin este campo, la búsqueda de partes siempre fallaba en silencio y
    // EntregaProgramada nunca generaba ninguna notificación real desde que se construyó en Sprint 5.
    this.eventBus.emit('EntregaProgramada', {
      id: entrega.id,
      idReferencia: entrega.idReferencia,
      tipoOperacion: entrega.tipoOperacion,
    });
    return entrega;
  }
}
