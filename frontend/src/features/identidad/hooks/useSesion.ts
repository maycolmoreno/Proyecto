import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { identidadApi } from '../api/identidad.api.js';
import { limpiarToken, obtenerToken } from '@shared/lib/http-client';

// Hook puro: estado de sesión derivado del servidor (TanStack Query, ADR-043) — sin store global.
export function useSesion() {
  const tieneToken = Boolean(obtenerToken());

  return useQuery({
    queryKey: ['sesion'],
    queryFn: () => identidadApi.me(),
    enabled: tieneToken,
    retry: false,
  });
}

export function useCerrarSesion() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    limpiarToken();
    // `RutaProtegida` lee el token de forma imperativa (obtenerToken()), no reactiva a este cambio
    // — sin una navegación explícita, la página protegida en la que estás se queda montada tal cual
    // hasta que algo más fuerce un re-render (de ahí que hiciera falta refrescar manualmente para
    // que el "logout" surtiera efecto). `clear()` en vez de removeQueries: además de invalidar la
    // sesión, descarta datos cacheados de este usuario (notificaciones, mis publicaciones, etc.)
    // para que no queden visibles si otra persona inicia sesión después en el mismo navegador.
    queryClient.clear();
    navigate('/login');
  };
}
