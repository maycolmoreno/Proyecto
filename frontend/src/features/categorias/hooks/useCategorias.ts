import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriasApi } from '../api/categorias.api.js';
import type { Categoria } from '../types/index.js';

// Hook puro — categorías vigentes, usado por wizards y FiltroPanel de los 3 dominios core.
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriasApi.listar(),
    staleTime: 5 * 60 * 1000, // catálogo, cambia poco — 5 min sin refetch
  });
}

// Panel de administración (solo ADMINISTRADOR) — incluye categorías INACTIVA.
export function useCategoriasAdmin() {
  return useQuery({
    queryKey: ['categorias', 'admin'],
    queryFn: () => categoriasApi.listarTodas(),
  });
}

export function useCrearCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { nombre: string; tipo: string }) => categoriasApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}

export function useActualizarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { nombre?: string; tipo?: string; estado?: Categoria['estado'] } }) =>
      categoriasApi.actualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}
