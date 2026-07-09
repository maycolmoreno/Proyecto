import { useMutation } from '@tanstack/react-query';
import { iaApi } from '../api/ia.api.js';
import type { ClasificarInput } from '../types/index.js';

// Hook puro (CU-013/RF-015) — no invalida ninguna query, es una sugerencia efímera, nunca se
// persiste hasta que el usuario decida usarla (ADR-010, human-in-the-loop).
export function useClasificar() {
  return useMutation({
    mutationFn: (input: ClasificarInput) => iaApi.clasificar(input),
  });
}
