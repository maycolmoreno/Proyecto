import { useQuery } from '@tanstack/react-query';
import { categoriasApi } from '../api/categorias.api.js';

// Hook puro — categorías vigentes, usado por wizards y FiltroPanel de los 3 dominios core.
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasApi.listar(),
    staleTime: 5 * 60 * 1000, // catálogo, cambia poco — 5 min sin refetch
  });
}
