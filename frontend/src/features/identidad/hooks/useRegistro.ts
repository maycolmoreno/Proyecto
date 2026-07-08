import { useMutation } from '@tanstack/react-query';
import { identidadApi } from '../api/identidad.api.js';
import type { RegistroInput } from '../types/index.js';

// Hook puro (Fase 1, sección 9.2 — arquitectura funcional): encapsula la lógica de registro (RF-001).
export function useRegistro() {
  return useMutation({
    mutationFn: (input: RegistroInput) => identidadApi.registro(input),
  });
}
