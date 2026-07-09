import type { IDonacionRepository } from '@domain/donaciones/ports/IDonacionRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';
import { DonacionNoEncontradaError } from './ObtenerDonacionUseCase.js';
import { NoEsDueñoDeLaDonacionError } from './ActualizarDonacionUseCase.js';

/** DELETE /donaciones/:id — soft-delete a CANCELADA. Dueño o ADMINISTRADOR (Fase 4, sección 3). */
export class CancelarDonacionUseCase {
  constructor(private readonly donacionRepository: IDonacionRepository) {}

  async ejecutar(id: string, solicitante: { id: string; rol: Rol }): Promise<void> {
    const donacion = await this.donacionRepository.buscarPorId(id);
    if (!donacion) {
      throw new DonacionNoEncontradaError();
    }
    if (solicitante.rol !== 'ADMINISTRADOR' && !donacion.esDueño(solicitante.id)) {
      throw new NoEsDueñoDeLaDonacionError();
    }

    donacion.cancelar();
    await this.donacionRepository.actualizar(donacion);
  }
}
