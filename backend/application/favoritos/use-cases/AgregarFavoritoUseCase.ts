import type { IFavoritoRepository, TipoEntidadFavorito } from '@domain/favoritos/ports/IFavoritoRepository.js';
import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { ISolicitudRepository } from '@domain/solicitudes/ports/ISolicitudRepository.js';
import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';

export interface AgregarFavoritoInput {
  tipoEntidad: TipoEntidadFavorito;
  entidadId: string;
}

export class EntidadInvalidaParaFavoritoError extends Error {
  constructor() {
    super('La publicación indicada no existe.');
    this.name = 'EntidadInvalidaParaFavoritoError';
  }
}

/** POST /favoritos — a diferencia de PublicacionIndexService (proyección alimentada por eventos de
 * dominio), esta es una acción directa del usuario ("guardar"): se resuelve título/imagen de la
 * publicación en el momento (mismo criterio de denormalización que ya acepta PublicacionIndexEntry —
 * puede quedar desactualizado si la publicación se edita después, limitación conocida y aceptada). */
export class AgregarFavoritoUseCase {
  constructor(
    private readonly favoritoRepository: IFavoritoRepository,
    private readonly donacionRepository: IDonacionRepository,
    private readonly solicitudRepository: ISolicitudRepository,
    private readonly truequeRepository: ITruequeRepository,
  ) {}

  async ejecutar(usuarioId: string, input: AgregarFavoritoInput): Promise<void> {
    const { titulo, imagenUrl } = await this.resolverEntidad(input.tipoEntidad, input.entidadId);

    await this.favoritoRepository.agregar({
      usuarioId,
      tipoEntidad: input.tipoEntidad,
      entidadId: input.entidadId,
      titulo,
      imagenUrl,
    });
  }

  private async resolverEntidad(
    tipoEntidad: TipoEntidadFavorito,
    entidadId: string,
  ): Promise<{ titulo: string; imagenUrl: string | null }> {
    if (tipoEntidad === 'DONACION') {
      const donacion = await this.donacionRepository.buscarPorId(entidadId);
      if (!donacion) throw new EntidadInvalidaParaFavoritoError();
      return { titulo: donacion.titulo, imagenUrl: donacion.toJSON({ incluirUbicacionExacta: false }).imagenes[0] ?? null };
    }
    if (tipoEntidad === 'SOLICITUD') {
      const solicitud = await this.solicitudRepository.buscarPorId(entidadId);
      if (!solicitud) throw new EntidadInvalidaParaFavoritoError();
      return { titulo: solicitud.titulo, imagenUrl: null };
    }
    const trueque = await this.truequeRepository.buscarPorId(entidadId);
    if (!trueque) throw new EntidadInvalidaParaFavoritoError();
    return { titulo: trueque.titulo, imagenUrl: trueque.toJSON({}).imagenes[0] ?? null };
  }
}
