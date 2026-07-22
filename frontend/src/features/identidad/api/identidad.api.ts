import { httpClient } from '@shared/lib/http-client';
import type { UbicacionInput } from '@shared/lib/ubicacion';
import type {
  LoginInput,
  LoginResult,
  RegistroInput,
  UsuarioPublico,
  PerfilPropio,
  ActualizarPerfilesInput,
  PerfilFuncional,
} from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1) — un archivo por feature, no un servicio global.
export const identidadApi = {
  registro: (input: RegistroInput) => httpClient.post<UsuarioPublico>('/auth/registro', input),
  login: (input: LoginInput) => httpClient.post<LoginResult>('/auth/login', input),
  me: () => httpClient.get<PerfilPropio>('/usuarios/me'),
  actualizarPerfiles: (input: ActualizarPerfilesInput) =>
    httpClient.patch<{ perfiles: PerfilFuncional[] }>('/usuarios/me/perfiles', input),
  actualizarUbicacion: (input: UbicacionInput) => httpClient.patch<UbicacionInput>('/usuarios/me/ubicacion', input),
};
