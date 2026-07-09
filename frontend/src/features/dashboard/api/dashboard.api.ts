import { httpClient } from '@shared/lib/http-client';
import type { DashboardImpacto } from '../types/index.js';

export const dashboardApi = {
  obtenerImpacto: () => httpClient.get<DashboardImpacto>('/dashboard/impacto'),
};
