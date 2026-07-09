import type { MatchingService } from '@domain/ia/services/MatchingService.js';
import type { MatchResultado } from '@domain/ia/ports/IIAProvider.js';
import type { TipoEntidadIA } from '@domain/ia/ports/IAnalisisIARepository.js';

/** GET /ia/matching?entidadTipo=&entidadId= — CU-014/RF-016 (Fase 4, sección 3). */
export class ObtenerMatchesUseCase {
  constructor(private readonly matchingService: MatchingService) {}

  async ejecutar(entidadTipo: TipoEntidadIA, entidadId: string): Promise<MatchResultado[]> {
    return this.matchingService.buscarCoincidencias(entidadTipo, entidadId);
  }
}
