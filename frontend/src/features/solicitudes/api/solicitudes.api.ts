import { httpClient } from '@shared/lib/http-client';
import type {
  Solicitud,
  CrearSolicitudInput,
  CrearOfertaInput,
  ListarSolicitudesFiltros,
} from '../types/index.js';

function aQueryString(filtros: ListarSolicitudesFiltros): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') params.set(clave, String(valor));
  }
  return params.toString();
}

// Cliente API del módulo (Fase 1, sección 9.1).
export const solicitudesApi = {
  listar: (filtros: ListarSolicitudesFiltros) => httpClient.getPaginado<Solicitud>(`/solicitudes?${aQueryString(filtros)}`),
  obtener: (id: string) => httpClient.get<Solicitud>(`/solicitudes/${id}`),
  crear: (input: CrearSolicitudInput) => httpClient.post<Solicitud>('/solicitudes', input),
  crearOferta: (solicitudId: string, input: CrearOfertaInput) =>
    httpClient.post<Solicitud>(`/solicitudes/${solicitudId}/ofertas`, input),
  // PATCH /solicitudes/:id/ofertas/:ofertaId — sin body, siempre rechaza (RF-010; aceptar ya
  // ocurrió al crear la oferta en un solo paso, Fase 4).
  rechazarOferta: (solicitudId: string, ofertaId: string) =>
    httpClient.patch<Solicitud>(`/solicitudes/${solicitudId}/ofertas/${ofertaId}`),
};
