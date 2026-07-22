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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    // fetch() rechaza (sin llegar a haber respuesta HTTP) cuando el servidor está caído, hay un
    // problema de CORS/DNS, o el usuario está sin conexión. El mensaje nativo del navegador
    // ("NetworkError when attempting to fetch resource", "Failed to fetch") no es entendible para
    // un usuario final — se normaliza al mismo ApiError que ya maneja el resto de la app.
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

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

// Respuesta 200/201 con cuerpo que no es JSON válido (proxy caído, error de gateway, etc.) es un
// caso borde raro pero real — sin este catch, `.json()` lanza un SyntaxError críptico que también
// se filtraría crudo a la UI, igual que el NetworkError de fetchApi.
async function leerJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, 'RESPUESTA_INVALIDA', 'El servidor devolvió una respuesta inesperada. Inténtalo de nuevo.');
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchApi(path, init);

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await leerJson<{ data: T }>(response);
  return body.data;
}

// Listados paginados (Fase 4, ADR-018: envelope {data, meta}) — a diferencia de `request`, no
// descarta `meta` (page/limit/total/totalPages), necesario para renderizar paginación.
async function requestPaginado<T>(path: string): Promise<RespuestaPaginada<T>> {
  const response = await fetchApi(path, { method: 'GET' });
  return leerJson<RespuestaPaginada<T>>(response);
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
