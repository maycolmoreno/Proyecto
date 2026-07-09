import type { ITruequeRepository } from '@domain/trueques/ports/ITruequeRepository.js';
import type { FirmaSubida, ICloudStorage } from '@domain/donaciones/ports/ICloudStorage.js';
import { ArchivoInvalidoError } from '@domain/donaciones/ports/ICloudStorage.js';
import { TruequeNoEncontradoError } from './ObtenerTruequeUseCase.js';
import { NoEsDueñoDelTruequeError } from './ActualizarTruequeUseCase.js';

const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export interface FirmarSubidaImagenInput {
  mimeType: string;
  tamanoBytes: number;
}

/** POST /trueques/:id/imagenes/firma — RF-006/CU-004 aplicado transversalmente a Trueques (Fase 2,
 * sección 3: "BC-Donaciones / BC-Solicitudes / BC-Trueques"). Reutiliza ICloudStorage directamente
 * (puerto genérico, sin estado propio de ningún módulo — no amerita duplicarlo como los repositories). */
export class FirmarSubidaImagenUseCase {
  constructor(
    private readonly truequeRepository: ITruequeRepository,
    private readonly cloudStorage: ICloudStorage,
  ) {}

  async ejecutar(truequeId: string, solicitanteId: string, input: FirmarSubidaImagenInput): Promise<FirmaSubida> {
    const trueque = await this.truequeRepository.buscarPorId(truequeId);
    if (!trueque) {
      throw new TruequeNoEncontradoError();
    }
    if (!trueque.esDueño(solicitanteId)) {
      throw new NoEsDueñoDelTruequeError();
    }
    if (!MIME_TYPES_PERMITIDOS.includes(input.mimeType)) {
      throw new ArchivoInvalidoError('Formato de imagen no permitido. Usa JPEG, PNG o WEBP.');
    }
    if (input.tamanoBytes > TAMANO_MAXIMO_BYTES) {
      throw new ArchivoInvalidoError('La imagen supera el límite de 5 MB.');
    }

    return this.cloudStorage.firmarSubida({
      tipoEntidad: 'TRUEQUE',
      idEntidad: truequeId,
      mimeType: input.mimeType,
      tamanoBytes: input.tamanoBytes,
    });
  }
}
