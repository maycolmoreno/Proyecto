import type { IIAProvider, MatchCandidato, MatchResultado } from '../ports/IIAProvider.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { TipoEntidadIA } from '../ports/IAnalisisIARepository.js';

const MAX_CANDIDATOS = 10;

export class EntidadInvalidaParaMatchingError extends Error {
  constructor() {
    super('La entidad indicada no existe.');
    this.name = 'EntidadInvalidaParaMatchingError';
  }
}

interface CandidatoConPrioridad {
  candidato: MatchCandidato;
  urgenciaAlta: boolean;
}

/** Domain Service (Fase 2, sección 6) — CU-014/RF-016. Filtro determinista en Postgres (categoría +
 * estado; sin radio geográfico — `MapsAdapter` mencionado en Fase 7 sección 4 no está implementado
 * en ningún otro flujo del proyecto, ver docs/fases/fase-06-backend.md historial) antes de invocar
 * IA solo sobre los candidatos preseleccionados. */
export class MatchingService {
  constructor(
    private readonly iaProvider: IIAProvider,
    private readonly donacionRepository: IDonacionRepository,
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly truequeRepository: ITruequeRepository,
  ) {}

  async buscarCoincidencias(entidadTipo: TipoEntidadIA, entidadId: string): Promise<MatchResultado[]> {
    const { origen, candidatos } = await this.resolverOrigenYCandidatos(entidadTipo, entidadId);

    const resultados = await Promise.all(
      candidatos.map(({ candidato }) => this.iaProvider.matchScore(origen, candidato)),
    );

    const urgenciaPorCandidatoId = new Map(candidatos.map((c) => [c.candidato.id, c.urgenciaAlta]));
    return resultados.sort((a, b) => {
      const urgenciaA = urgenciaPorCandidatoId.get(a.candidatoId) ?? false;
      const urgenciaB = urgenciaPorCandidatoId.get(b.candidatoId) ?? false;
      if (urgenciaA !== urgenciaB) return urgenciaA ? -1 : 1;
      return b.score - a.score;
    });
  }

  private async resolverOrigenYCandidatos(
    entidadTipo: TipoEntidadIA,
    entidadId: string,
  ): Promise<{ origen: MatchCandidato; candidatos: CandidatoConPrioridad[] }> {
    if (entidadTipo === 'DONACION') {
      const donacion = await this.donacionRepository.buscarPorId(entidadId);
      if (!donacion) throw new EntidadInvalidaParaMatchingError();
      const { items } = await this.solicitudRepository.listar(
        { estado: 'ABIERTA', categoriaId: donacion.categoriaId },
        { page: 1, limit: MAX_CANDIDATOS + 1 },
      );
      return {
        origen: { id: donacion.id, titulo: donacion.titulo, descripcion: donacion.descripcion },
        // Excluye las solicitudes del propio donante — mismo criterio que ya aplicaba la rama
        // TRUEQUE (no tiene sentido sugerir la propia publicación como coincidencia).
        candidatos: items
          .filter((s) => s.beneficiarioId !== donacion.donanteId)
          .slice(0, MAX_CANDIDATOS)
          .map((s) => ({
            candidato: { id: s.id, titulo: s.titulo, descripcion: s.descripcion },
            urgenciaAlta: s.urgencia === 'ALTA',
          })),
      };
    }

    if (entidadTipo === 'SOLICITUD') {
      const solicitud = await this.solicitudRepository.buscarPorId(entidadId);
      if (!solicitud) throw new EntidadInvalidaParaMatchingError();
      const { items } = await this.donacionRepository.listar(
        { estado: 'PUBLICADA', categoriaId: solicitud.categoriaId },
        { page: 1, limit: MAX_CANDIDATOS + 1 },
      );
      return {
        origen: { id: solicitud.id, titulo: solicitud.titulo, descripcion: solicitud.descripcion },
        candidatos: items
          .filter((d) => d.donanteId !== solicitud.beneficiarioId)
          .slice(0, MAX_CANDIDATOS)
          .map((d) => ({
            candidato: { id: d.id, titulo: d.titulo, descripcion: d.descripcion },
            urgenciaAlta: false,
          })),
      };
    }

    const trueque = await this.truequeRepository.buscarPorId(entidadId);
    if (!trueque) throw new EntidadInvalidaParaMatchingError();
    const { items } = await this.truequeRepository.listar(
      { estado: 'PUBLICADO', categoriaId: trueque.categoriaId },
      { page: 1, limit: MAX_CANDIDATOS + 1 },
    );
    return {
      origen: { id: trueque.id, titulo: trueque.titulo, descripcion: trueque.descripcion },
      candidatos: items
        .filter((t) => t.id !== trueque.id && t.usuarioId !== trueque.usuarioId)
        .slice(0, MAX_CANDIDATOS)
        .map((t) => ({
          candidato: { id: t.id, titulo: t.titulo, descripcion: t.descripcion },
          urgenciaAlta: false,
        })),
    };
  }
}
