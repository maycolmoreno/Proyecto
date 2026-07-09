import type { DashboardQueryService, DashboardImpacto } from '@domain/dashboard/services/DashboardQueryService.js';

/** GET /dashboard/impacto — CU-012/RF-019, autenticado (Fase 4). */
export class ObtenerDashboardImpactoUseCase {
  constructor(private readonly dashboardQueryService: DashboardQueryService) {}

  async ejecutar(): Promise<DashboardImpacto> {
    return this.dashboardQueryService.obtenerImpacto();
  }
}
