import { httpClient } from '@shared/lib/http-client';

export interface UsuarioPublicoMinimo {
  id: string;
  nombre: string;
}

// Cliente API — GET /usuarios/:id (extensión Sprint F5): resuelve el nombre de otro usuario sin
// exponer datos sensibles (correo/teléfono/rol/estado), a diferencia de GET /usuarios/me.
export const usuariosApi = {
  obtenerPorId: (id: string) => httpClient.get<UsuarioPublicoMinimo>(`/usuarios/${id}`),
};
