import { useMutation, useQueryClient } from '@tanstack/react-query';
import { identidadApi } from '../api/identidad.api.js';
import { guardarToken } from '@shared/lib/http-client';
import type { LoginInput } from '../types/index.js';

// Hook puro (RF-002): al iniciar sesión, guarda el token y refresca la sesión cacheada.
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => identidadApi.login(input),
    onSuccess: (resultado) => {
      guardarToken(resultado.token);
      queryClient.setQueryData(['sesion'], resultado.usuario);
    },
  });
}
