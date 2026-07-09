import type { SolicitudResponse } from '@domain/solicitudes/entities/Solicitud.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { Urgencia } from '@domain/solicitudes/value-objects/Urgencia.js';
import { SolicitudNoEncontradaError } from './ObtenerSolicitudUseCase.js';

export interface ActualizarSolicitudInput {
  titulo?: string;
  descripcion?: string;
  urgencia?: Urgencia;
  cancelar?: boolean;
}

export class NoEsDueñoDeLaSolicitudError extends Error {
  constructor() {
    super('No tienes permiso para modificar esta solicitud.');
    this.name = 'NoEsDueñoDeLaSolicitudError';
  }
}

/** PATCH /solicitudes/:id — editar o cancelar, solo dueño (Fase 4, sección 3: un único endpoint para ambos). */
export class ActualizarSolicitudUseCase {
  constructor(private readonly solicitudRepository: ISolicitudRepository) {}

  async ejecutar(id: string, solicitanteId: string, input: ActualizarSolicitudInput): Promise<SolicitudResponse> {
    const solicitud = await this.solicitudRepository.buscarPorId(id);
    if (!solicitud) {
      throw new SolicitudNoEncontradaError();
    }
    if (!solicitud.esDueño(solicitanteId)) {
      throw new NoEsDueñoDeLaSolicitudError();
    }

    if (input.cancelar) {
      solicitud.cancelar();
    } else {
      solicitud.actualizar({ titulo: input.titulo, descripcion: input.descripcion, urgencia: input.urgencia });
    }

    await this.solicitudRepository.actualizar(solicitud);
    return solicitud.toJSON({ incluirUbicacionExacta: true, solicitanteId });
  }
}
