import type { ClasificacionService, ClasificarInput } from '@domain/ia/services/ClasificacionService.js';
import type { ClasificacionResultado } from '@domain/ia/ports/IIAProvider.js';

/** POST /ia/clasificar — CU-013/RF-015 (Fase 4, sección 3). */
export class ClasificarUseCase {
  constructor(private readonly clasificacionService: ClasificacionService) {}

  async ejecutar(input: ClasificarInput): Promise<ClasificacionResultado> {
    return this.clasificacionService.clasificar(input);
  }
}
