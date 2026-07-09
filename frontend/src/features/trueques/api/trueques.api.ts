import { httpClient } from '@shared/lib/http-client';
import type { FirmaSubida } from '@shared/lib/cloudinary';
import type { Trueque, CrearTruequeInput, ProponerTruequeInput, ListarTruequesFiltros } from '../types/index.js';

function aQueryString(filtros: ListarTruequesFiltros): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') params.set(clave, String(valor));
  }
  return params.toString();
}

// Cliente API del módulo (Fase 1, sección 9.1).
export const truequesApi = {
  listar: (filtros: ListarTruequesFiltros) => httpClient.getPaginado<Trueque>(`/trueques?${aQueryString(filtros)}`),
  obtener: (id: string) => httpClient.get<Trueque>(`/trueques/${id}`),
  crear: (input: CrearTruequeInput) => httpClient.post<Trueque>('/trueques', input),
  cancelar: (id: string) => httpClient.patch<Trueque>(`/trueques/${id}`, { cancelar: true }),
  proponer: (truequeOrigenId: string, input: ProponerTruequeInput) =>
    httpClient.post<Trueque>(`/trueques/${truequeOrigenId}/propuestas`, input),
  // PATCH /trueques/:id/propuestas/:propuestaId — solo el dueño del trueque origen (RF-013).
  aceptarPropuesta: (truequeOrigenId: string, propuestaId: string) =>
    httpClient.patch<Trueque>(`/trueques/${truequeOrigenId}/propuestas/${propuestaId}`, { aceptar: true }),
  rechazarPropuesta: (truequeOrigenId: string, propuestaId: string) =>
    httpClient.patch<Trueque>(`/trueques/${truequeOrigenId}/propuestas/${propuestaId}`, { rechazar: true }),
  firmarImagen: (id: string, mimeType: string, tamanoBytes: number) =>
    httpClient.post<FirmaSubida>(`/trueques/${id}/imagenes/firma`, { mimeType, tamanoBytes }),
  registrarImagen: (id: string, url: string, publicId: string) =>
    httpClient.post<{ imagenes: string[] }>(`/trueques/${id}/imagenes`, { url, publicId }),
};
