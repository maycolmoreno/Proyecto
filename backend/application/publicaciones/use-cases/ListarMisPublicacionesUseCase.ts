import type { IPublicacionIndexRepository, PublicacionIndexEntry } from '@domain/publicaciones/ports/IPublicacionIndexRepository.js';

/** GET /publicaciones/mias — historial unificado de Donaciones/Solicitudes/Trueques propios (Fase 5
 * diferida, docs/DISENO_MODELO_PERFILES.md sección 7), autenticado. */
export class ListarMisPublicacionesUseCase {
  constructor(private readonly publicacionIndexRepository: IPublicacionIndexRepository) {}

  async ejecutar(usuarioId: string): Promise<PublicacionIndexEntry[]> {
    return this.publicacionIndexRepository.listarPorUsuario(usuarioId);
  }
}
