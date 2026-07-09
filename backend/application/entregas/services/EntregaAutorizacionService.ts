import type { Entrega } from '@domain/entregas/entities/Entrega.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';

/** Resuelve quiénes son las "partes involucradas" de una Entrega (Fase 4: autorización de GET/PATCH
 * /entregas/:id). Entrega solo guarda una referencia polimórfica (ADR-015) — no hay forma directa de
 * saber quiénes son las partes sin consultar el aggregate que originó la entrega (y, para TRUEQUE,
 * la propuesta aceptada dentro de ese aggregate). Devuelve un array genérico (no "donante/beneficiario")
 * porque el par de partes involucradas difiere según tipoOperacion (donante+beneficiario vs. dos
 * usuarios de trueque). */
export class EntregaAutorizacionService {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly truequeRepository: ITruequeRepository,
  ) {}

  async resolverPartes(entrega: Entrega): Promise<string[]> {
    if (entrega.tipoOperacion === 'DONACION') {
      const [donacion, solicitud] = await Promise.all([
        this.donacionRepository.buscarPorId(entrega.idReferencia),
        this.solicitudRepository.buscarPorOfertaDonacionAceptada(entrega.idReferencia),
      ]);
      return [donacion?.donanteId, solicitud?.beneficiarioId].filter((id): id is string => !!id);
    }

    // TRUEQUE: entrega.idReferencia es el trueque ORIGEN (Fase 6, sección 5 — mismo patrón que DONACION).
    const truequeOrigen = await this.truequeRepository.buscarPorId(entrega.idReferencia);
    if (!truequeOrigen) return [];
    const propuestaAceptada = truequeOrigen.propuestasRecibidas.find((p) => p.estado === 'ACEPTADA');
    return [truequeOrigen.usuarioId, propuestaAceptada?.usuarioProponenteId].filter((id): id is string => !!id);
  }

  async esParteInvolucrada(entrega: Entrega, usuarioId: string): Promise<boolean> {
    const partes = await this.resolverPartes(entrega);
    return partes.includes(usuarioId);
  }
}
