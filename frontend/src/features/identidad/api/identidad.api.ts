import { httpClient } from '@shared/lib/http-client';
import type { LoginInput, LoginResult, RegistroInput, UsuarioPublico } from '../types/index.js';

// Cliente API del módulo (Fase 1, sección 9.1) — un archivo por feature, no un servicio global.
export const identidadApi = {
  registro: (input: RegistroInput) => httpClient.post<UsuarioPublico>('/auth/registro', input),
  login: (input: LoginInput) => httpClient.post<LoginResult>('/auth/login', input),
  me: () => httpClient.get<UsuarioPublico>('/usuarios/me'),
};
