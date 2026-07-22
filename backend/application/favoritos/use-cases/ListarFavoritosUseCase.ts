import type { IFavoritoRepository, Favorito } from '@domain/favoritos/ports/IFavoritoRepository.js';

/** GET /favoritos — propios, autenticado. */
export class ListarFavoritosUseCase {
  constructor(private readonly favoritoRepository: IFavoritoRepository) {}

  async ejecutar(usuarioId: string): Promise<Favorito[]> {
    return this.favoritoRepository.listarPorUsuario(usuarioId);
  }
}
