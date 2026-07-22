export interface MensajeChat {
  rol: 'usuario' | 'bot';
  texto: string;
}

export interface ClasificacionInput {
  titulo: string;
  descripcion: string;
  categoriasVigentes: string[];
  /** La prioridad solo aplica a solicitudes (Fase 7, sección 3). */
  esSolicitud: boolean;
}

export interface ClasificacionResultado {
  categoriaSugerida: string;
  tituloSugerido: string;
  descripcionSugerida: string;
  prioridadSugerida: 'BAJA' | 'MEDIA' | 'ALTA' | null;
}

export interface MatchCandidato {
  id: string;
  titulo: string;
  descripcion: string;
}

export interface MatchResultado {
  candidatoId: string;
  score: number;
  razon: string;
}

export type CategoriaRiesgo = 'CONTENIDO_INADECUADO' | 'POSIBLE_FRAUDE' | 'DATOS_SENSIBLES_EXPUESTOS';

export interface EvaluarRiesgoResultado {
  riesgoDetectado: boolean;
  categoriaRiesgo: CategoriaRiesgo | null;
  confianza: number;
  explicacion: string;
}

/** Puerto de salida (Open Host Service, Fase 2 sección 2) — implementado en
 * adapters/ia/external/{ClaudeAdapter,GeminiAdapter} (ADR-010: llamadas a IA siempre server-side).
 * Oculta el proveedor concreto detrás de una interfaz de dominio — Fase 7 eligió Claude/Anthropic
 * (ADR-024), pero Sprint 5 cambia el adapter cableado en producción a Gemini por restricción de
 * acceso a una API key paga de Anthropic (decisión documentada en fase-07 historial). */
export interface IIAProvider {
  chat(mensaje: string, historial: MensajeChat[]): Promise<string>;
  clasificar(input: ClasificacionInput): Promise<ClasificacionResultado>;
  matchScore(origen: MatchCandidato, candidato: MatchCandidato): Promise<MatchResultado>;
  evaluarRiesgo(titulo: string, descripcion: string): Promise<EvaluarRiesgoResultado>;
}

/** Error compartido por todos los adapters de IIAProvider (RNF-002 — integraciones no bloqueantes,
 * mismo patrón que CloudinaryNoConfiguradoError): se lanza cuando la API key del proveedor
 * configurado está vacía. Vive en el puerto (no en un adapter concreto) para que cualquier
 * implementación de IIAProvider la comparta sin importar entre adapters hermanos. */
export class IAProviderNoConfiguradoError extends Error {
  constructor() {
    super('El servicio de inteligencia artificial no está configurado.');
    this.name = 'IAProviderNoConfiguradoError';
  }
}

/** Se lanza cuando el proveedor de IA devuelve una respuesta que no se pudo interpretar como el
 * JSON esperado (ej. truncada por `max_tokens`/`maxOutputTokens`, o el modelo no respetó el
 * schema). Antes esto se propagaba como un SyntaxError crudo de `JSON.parse`, indistinguible de
 * cualquier otro bug — un 500 genérico ("Ocurrió un error inesperado") sin pista de la causa real. */
export class IARespuestaInvalidaError extends Error {
  constructor() {
    super('El servicio de inteligencia artificial devolvió una respuesta inválida. Intenta de nuevo.');
    this.name = 'IARespuestaInvalidaError';
  }
}

/** Helper compartido por los adapters de IIAProvider — centraliza el `JSON.parse` defensivo para
 * no duplicar el mismo try/catch en cada método de cada adapter. */
export function parsearJSONDeIA<T>(texto: string): T {
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new IARespuestaInvalidaError();
  }
}
