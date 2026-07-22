import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { IUsuarioPerfilRepository } from '@domain/identidad/ports/IUsuarioPerfilRepository.js';
import type { IEventoSistemaRepository } from '@domain/notificaciones/ports/IEventoSistemaRepository.js';

export interface DashboardImpacto {
  donaciones: { publicadas: number; entregadas: number };
  solicitudes: { abiertas: number; atendidas: number };
  trueques: { publicados: number; intercambiados: number };
  usuarios: { donantes: number; beneficiarios: number };
  eventosClave: { solicitudAtendida: number; truequeIntercambiado: number; entregaConfirmada: number };
}

const SIN_PAGINACION = { page: 1, limit: 1 };

/** Domain Service — CU-012/RF-019, GET /dashboard/impacto (Fase 4). No listado explícitamente
 * entre los Domain Services de Fase 2 sección 6 (que sí mapea CU-012 a "BC-Notificaciones/KPI
 * (transversal), lectura agregada de eventos de dominio") — se ubica en `domain/dashboard/` por
 * claridad de límites de módulo; decisión de placement documentada en fase-06-backend.md historial.
 * Combina conteos exactos de Postgres (`listar(...).total`, sin nuevos métodos de repositorio) con
 * la agregación Mongo de `eventos_sistema` (Fase 3, sección 4: "$group/$count"). */
export class DashboardQueryService {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly truequeRepository: ITruequeRepository,
    private readonly usuarioPerfilRepository: IUsuarioPerfilRepository,
    private readonly eventoSistemaRepository: IEventoSistemaRepository,
  ) {}

  async obtenerImpacto(): Promise<DashboardImpacto> {
    const [
      donacionesPublicadas,
      donacionesEntregadas,
      solicitudesAbiertas,
      solicitudesAtendidas,
      truequesPublicados,
      truequesIntercambiados,
      donantes,
      beneficiarios,
      eventosClave,
    ] = await Promise.all([
      this.donacionRepository.listar({ estado: 'PUBLICADA' }, SIN_PAGINACION),
      this.donacionRepository.listar({ estado: 'ENTREGADA' }, SIN_PAGINACION),
      this.solicitudRepository.listar({ estado: 'ABIERTA' }, SIN_PAGINACION),
      this.solicitudRepository.listar({ estado: 'ATENDIDA' }, SIN_PAGINACION),
      this.truequeRepository.listar({ estado: 'PUBLICADO' }, SIN_PAGINACION),
      this.truequeRepository.listar({ estado: 'INTERCAMBIADO' }, SIN_PAGINACION),
      this.usuarioPerfilRepository.contarUsuarios('DONANTE'),
      // "beneficiarios" es nombre histórico del DTO (Fase 4) — ahora cuenta perfil SOLICITANTE
      // (Opción D, docs/DISENO_MODELO_PERFILES.md), no se renombra el campo para no romper el
      // contrato de /dashboard/impacto ya consumido por el frontend (Sprint F5).
      this.usuarioPerfilRepository.contarUsuarios('SOLICITANTE'),
      this.eventoSistemaRepository.contarPorTipoEvento(['SolicitudAtendida', 'TruequeIntercambiado', 'EntregaConfirmada']),
    ]);

    const totalPorTipo = (tipo: string): number => eventosClave.find((e) => e.tipoEvento === tipo)?.total ?? 0;

    return {
      donaciones: { publicadas: donacionesPublicadas.total, entregadas: donacionesEntregadas.total },
      solicitudes: { abiertas: solicitudesAbiertas.total, atendidas: solicitudesAtendidas.total },
      trueques: { publicados: truequesPublicados.total, intercambiados: truequesIntercambiados.total },
      usuarios: { donantes, beneficiarios },
      eventosClave: {
        solicitudAtendida: totalPorTipo('SolicitudAtendida'),
        truequeIntercambiado: totalPorTipo('TruequeIntercambiado'),
        entregaConfirmada: totalPorTipo('EntregaConfirmada'),
      },
    };
  }
}
