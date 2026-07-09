import { useQuery } from '@tanstack/react-query';
import { administracionApi } from '../api/administracion.api.js';

// Hook puro — publicaciones marcadas con riesgo por ModeracionIAService, pendientes de revisión
// humana (RF-018, ADR-027).
export function useReportes() {
  return useQuery({
    queryKey: ['admin', 'reportes'],
    queryFn: () => administracionApi.reportes(),
  });
}
