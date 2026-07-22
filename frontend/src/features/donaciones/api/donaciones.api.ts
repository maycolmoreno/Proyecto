import { httpClient, type RespuestaPaginada } from '@shared/lib/http-client';
import type { FirmaSubida } from '@shared/lib/cloudinary';
import type {
  Donacion,
  CrearDonacionInput,
  ActualizarDonacionInput,
  ListarDonacionesFiltros,
  CrearReservaInput,
} from '../types/index.js';

function aQueryString(filtros: ListarDonacionesFiltros): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') params.set(clave, String(valor));
  }
  return params.toString();
}

// Cliente API del módulo (Fase 1, sección 9.1).
export const donacionesApi = {
  listar: (filtros: ListarDonacionesFiltros) =>
    httpClient.getPaginado<Donacion>(`/donaciones?${aQueryString(filtros)}`),
  obtener: (id: string) => httpClient.get<Donacion>(`/donaciones/${id}`),
  crear: (input: CrearDonacionInput) => httpClient.post<Donacion>('/donaciones', input),
  actualizar: (id: string, input: ActualizarDonacionInput) => httpClient.patch<Donacion>(`/donaciones/${id}`, input),
  cancelar: (id: string) => httpClient.delete<void>(`/donaciones/${id}`),
  firmarImagen: (id: string, mimeType: string, tamanoBytes: number) =>
    httpClient.post<FirmaSubida>(`/donaciones/${id}/imagenes/firma`, { mimeType, tamanoBytes }),
  registrarImagen: (id: string, url: string, publicId: string) =>
    httpClient.post<{ imagenes: string[] }>(`/donaciones/${id}/imagenes`, { url, publicId }),
  reservar: (id: string, input: CrearReservaInput) => httpClient.post<Donacion>(`/donaciones/${id}/reservas`, input),
  // PATCH /donaciones/:id/reservas/:reservaId — solo el donante (RF nuevo, "Quiero este artículo").
  aceptarReserva: (id: string, reservaId: string) =>
    httpClient.patch<Donacion>(`/donaciones/${id}/reservas/${reservaId}`, { aceptar: true }),
  rechazarReserva: (id: string, reservaId: string) =>
    httpClient.patch<Donacion>(`/donaciones/${id}/reservas/${reservaId}`, { rechazar: true }),
};

export type { RespuestaPaginada };
