import { randomUUID } from 'node:crypto';
import { Solicitud, type SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type {
  IUbicacionSolicitudRepository,
  CrearUbicacionSolicitudInput,
} from '@domain/solicitudes/ports/IUbicacionSolicitudRepository.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';
import type { Urgencia } from '@domain/solicitudes/value-objects/Urgencia.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

export interface CrearSolicitudInput {
  beneficiarioId: string;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  urgencia: Urgencia;
  ubicacion: CrearUbicacionSolicitudInput;
  evidenciaUrl?: string;
}

export class CategoriaInvalidaError extends Error {
  constructor() {
    super('La categoría indicada no existe o no está activa.');
    this.name = 'CategoriaInvalidaError';
  }
}

/** CU-005 Crear solicitud de ayuda (RF-008). BC-Categorías es Shared Kernel (Fase 2, sección 2). */
export class CrearSolicitudUseCase {
  constructor(
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly ubicacionRepository: IUbicacionSolicitudRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async ejecutar(input: CrearSolicitudInput): Promise<SolicitudResponse> {
    const categoria = await this.categoriaRepository.buscarPorId(input.categoriaId);
    if (!categoria || categoria.estado !== 'ACTIVA') {
      throw new CategoriaInvalidaError();
    }

    const ubicacion = await this.ubicacionRepository.crear(input.beneficiarioId, input.ubicacion);

    const solicitud = Solicitud.crear({
      id: randomUUID(),
      beneficiarioId: input.beneficiarioId,
      categoria: categoria.toJSON(),
      titulo: input.titulo,
      descripcion: input.descripcion,
      urgencia: input.urgencia,
      ubicacion,
      evidenciaUrl: input.evidenciaUrl,
    });

    await this.solicitudRepository.crear(solicitud);
    // Fase 7 sección 5 — listener real desde Sprint 4: ModeracionIAService.
    // beneficiarioId/estadoSolicitud: nuevos, consumidos por PublicacionIndexService (Fase 5
    // diferida) — este evento antes no llevaba dueño porque nadie lo necesitaba; campos aditivos,
    // ModeracionIAService sigue leyendo solo {id,titulo,descripcion} sin romperse.
    this.eventBus.emit('SolicitudCreada', {
      id: solicitud.id,
      titulo: input.titulo,
      descripcion: input.descripcion,
      beneficiarioId: input.beneficiarioId,
      estadoSolicitud: solicitud.estadoSolicitud,
    });
    return solicitud.toJSON({ incluirUbicacionExacta: true, solicitanteId: input.beneficiarioId });
  }
}
