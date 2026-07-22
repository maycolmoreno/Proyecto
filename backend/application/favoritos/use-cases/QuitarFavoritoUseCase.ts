import type { IFavoritoRepository, TipoEntidadFavorito } from '@domain/favoritos/ports/IFavoritoRepository.js';

/** DELETE /favoritos/:tipoEntidad/:entidadId — idempotente: quitar algo que no estaba guardado no falla. */
export class QuitarFavoritoUseCase {
  constructor(private readonly favoritoRepository: IFavoritoRepository) {}

  async ejecutar(usuarioId: string, tipoEntidad: TipoEntidadFavorito, entidadId: string): Promise<void> {
    await this.favoritoRepository.quitar(usuarioId, tipoEntidad, entidadId);
  }
}
