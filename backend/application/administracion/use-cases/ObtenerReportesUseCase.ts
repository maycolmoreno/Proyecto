import type { ModeracionService } from '@domain/administracion/services/ModeracionService.js';
import type { AnalisisIA } from '@domain/ia/ports/IAnalisisIARepository.js';

/** GET /admin/reportes — CU-011/RF-018, ADMINISTRADOR (Fase 4). Publicaciones marcadas con riesgo
 * por ModeracionIAService (Fase 7 sección 5, ADR-027), pendientes de revisión humana. */
export class ObtenerReportesUseCase {
  constructor(private readonly moderacionService: ModeracionService) {}

  async ejecutar(): Promise<AnalisisIA[]> {
    return this.moderacionService.obtenerReportes();
  }
}
