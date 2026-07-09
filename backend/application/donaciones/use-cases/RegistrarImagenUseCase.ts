import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { IImagenRepository } from '@domain/donaciones/ports/IImagenRepository.js';
import { DonacionNoEncontradaError } from './ObtenerDonacionUseCase.js';
import { NoEsDueñoDeLaDonacionError } from './ActualizarDonacionUseCase.js';

export interface RegistrarImagenInput {
  url: string;
  publicId: string;
}

/** POST /donaciones/:id/imagenes — registra la URL tras la subida directa a Cloudinary (RF-006/CU-004). */
export class RegistrarImagenUseCase {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly imagenRepository: IImagenRepository,
  ) {}

  async ejecutar(donacionId: string, solicitanteId: string, input: RegistrarImagenInput): Promise<string[]> {
    const donacion = await this.donacionRepository.buscarPorId(donacionId);
    if (!donacion) {
      throw new DonacionNoEncontradaError();
    }
    if (!donacion.esDueño(solicitanteId)) {
      throw new NoEsDueñoDeLaDonacionError();
    }

    await this.imagenRepository.crear({
      tipoEntidad: 'DONACION',
      idEntidad: donacionId,
      url: input.url,
      publicId: input.publicId,
    });

    return this.imagenRepository.listarUrlsPorEntidad('DONACION', donacionId);
  }
}
