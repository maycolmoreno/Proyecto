import { httpClient } from '@shared/lib/http-client';
import type {
  UsuarioAdmin,
  ListarUsuariosFiltros,
  ReporteIA,
  AccionModeracion,
  TipoEntidadModeracion,
} from '../types/index.js';

function aQueryString(filtros: ListarUsuariosFiltros): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') params.set(clave, String(valor));
  }
  return params.toString();
}

const RUTA_POR_TIPO: Record<TipoEntidadModeracion, string> = {
  DONACION: 'donaciones',
  SOLICITUD: 'solicitudes',
  TRUEQUE: 'trueques',
};

// Cliente API del módulo (Fase 1, sección 9.1).
export const administracionApi = {
  listarUsuarios: (filtros: ListarUsuariosFiltros) =>
    httpClient.getPaginado<UsuarioAdmin>(`/admin/usuarios?${aQueryString(filtros)}`),
  moderarUsuario: (id: string, accion: AccionModeracion) =>
    httpClient.patch<UsuarioAdmin>(`/admin/usuarios/${id}/moderar`, { accion }),
  moderarPublicacion: (tipo: TipoEntidadModeracion, id: string, accion: AccionModeracion) =>
    httpClient.patch(`/admin/${RUTA_POR_TIPO[tipo]}/${id}/moderar`, { accion }),
  reportes: () => httpClient.get<ReporteIA[]>('/admin/reportes'),
};
