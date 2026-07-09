import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { IImagenRepository } from '@domain/trueques/ports/IImagenRepository.js';
import { TruequeNoEncontradoError } from './ObtenerTruequeUseCase.js';
import { NoEsDueñoDelTruequeError } from './ActualizarTruequeUseCase.js';

export interface RegistrarImagenInput {
  url: string;
  publicId: string;
}

/** POST /trueques/:id/imagenes — registra la URL tras la subida directa a Cloudinary (RF-006/CU-004). */
export class RegistrarImagenUseCase {
  constructor(
    private readonly truequeRepository: ITruequeRepository,
    private readonly imagenRepository: IImagenRepository,
  ) {}

  async ejecutar(truequeId: string, solicitanteId: string, input: RegistrarImagenInput): Promise<string[]> {
    const trueque = await this.truequeRepository.buscarPorId(truequeId);
    if (!trueque) {
      throw new TruequeNoEncontradoError();
    }
    if (!trueque.esDueño(solicitanteId)) {
      throw new NoEsDueñoDelTruequeError();
    }

    await this.imagenRepository.crear({
      tipoEntidad: 'TRUEQUE',
      idEntidad: truequeId,
      url: input.url,
      publicId: input.publicId,
    });

    return this.imagenRepository.listarUrlsPorEntidad('TRUEQUE', truequeId);
  }
}
