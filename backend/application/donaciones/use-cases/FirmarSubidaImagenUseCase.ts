import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { FirmaSubida, ICloudStorage } from '@domain/donaciones/ports/ICloudStorage.js';
import { ArchivoInvalidoError } from '@domain/donaciones/ports/ICloudStorage.js';
import { DonacionNoEncontradaError } from './ObtenerDonacionUseCase.js';
import { NoEsDueñoDeLaDonacionError } from './ActualizarDonacionUseCase.js';

const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export interface FirmarSubidaImagenInput {
  mimeType: string;
  tamanoBytes: number;
}

/** POST /donaciones/:id/imagenes/firma — RF-006/CU-004 (ADR-009). Solo el dueño. */
export class FirmarSubidaImagenUseCase {
  constructor(
    private readonly donacionRepository: IDonacionRepository,
    private readonly cloudStorage: ICloudStorage,
  ) {}

  async ejecutar(donacionId: string, solicitanteId: string, input: FirmarSubidaImagenInput): Promise<FirmaSubida> {
    const donacion = await this.donacionRepository.buscarPorId(donacionId);
    if (!donacion) {
      throw new DonacionNoEncontradaError();
    }
    if (!donacion.esDueño(solicitanteId)) {
      throw new NoEsDueñoDeLaDonacionError();
    }
    if (!MIME_TYPES_PERMITIDOS.includes(input.mimeType)) {
      throw new ArchivoInvalidoError('Formato de imagen no permitido. Usa JPEG, PNG o WEBP.');
    }
    if (input.tamanoBytes > TAMANO_MAXIMO_BYTES) {
      throw new ArchivoInvalidoError('La imagen supera el límite de 5 MB.');
    }

    return this.cloudStorage.firmarSubida({
      tipoEntidad: 'DONACION',
      idEntidad: donacionId,
      mimeType: input.mimeType,
      tamanoBytes: input.tamanoBytes,
    });
  }
}
