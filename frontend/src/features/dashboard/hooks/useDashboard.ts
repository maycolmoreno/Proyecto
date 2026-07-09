import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api.js';

// Hook puro — GET /dashboard/impacto exige sesión activa (CU-012/RF-019).
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'impacto'],
    queryFn: () => dashboardApi.obtenerImpacto(),
  });
}
