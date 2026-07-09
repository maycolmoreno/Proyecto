// Cliente HTTP centralizado (Fase 1, sección 9.1). Token en sessionStorage (ADR-032).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'donaconnect_token';

export function guardarToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function obtenerToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function limpiarToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface MetaPaginacion {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RespuestaPaginada<T> {
  data: T[];
  meta: MetaPaginacion;
}

async function fetchApi(path: string, init: RequestInit = {}): Promise<Response> {
  const token = obtenerToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error.code ?? 'UNKNOWN_ERROR',
      body?.error.message ?? 'Ocurrió un error inesperado.',
    );
  }

  return response;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchApi(path, init);

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as { data: T };
  return body.data;
}

// Listados paginados (Fase 4, ADR-018: envelope {data, meta}) — a diferencia de `request`, no
// descarta `meta` (page/limit/total/totalPages), necesario para renderizar paginación.
async function requestPaginado<T>(path: string): Promise<RespuestaPaginada<T>> {
  const response = await fetchApi(path, { method: 'GET' });
  return (await response.json()) as RespuestaPaginada<T>;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  getPaginado: <T>(path: string) => requestPaginado<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
