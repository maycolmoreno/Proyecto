import { GoogleGenAI, type Content } from '@google/genai';
import {
  IAProviderNoConfiguradoError,
  parsearJSONDeIA,
  type IIAProvider,
  type MensajeChat,
  type ClasificacionInput,
  type ClasificacionResultado,
  type MatchCandidato,
  type MatchResultado,
  type EvaluarRiesgoResultado,
} from '@domain/ia/ports/IIAProvider.js';

const SYSTEM_PROMPT_CHATBOT = `Rol: Asistente de DonaConnect Ecuador.
Alcance: orientar sobre donaciones, solicitudes, trueques, categorías, seguridad y funcionamiento de la plataforma.
Fuera de alcance: no das asesoría legal/médica/financiera; no verificas la condición socioeconómica de nadie (declara esto si te lo preguntan).
Estilo: español, claro, breve.`;

const SYSTEM_PROMPT_CLASIFICACION =
  'Dado el título y descripción de una publicación, sugiere un título y una descripción mejorados (mismo idioma), ' +
  'y si se indica que es una solicitud, una prioridad. Responde solo en el formato JSON solicitado.';

const SYSTEM_PROMPT_MATCHING =
  'Compara la publicación A contra el candidato B (ya filtrados por categoría/ubicación/estado). ' +
  'Da un score 0-1 de qué tan bien B satisface la necesidad/objeto de A, y una razón breve.';

const SYSTEM_PROMPT_MODERACION =
  'Evalúa si esta publicación podría ser contenido inadecuado, fraudulento, peligroso o exponer datos sensibles ' +
  '(direcciones exactas, números de identificación, contacto directo fuera de la plataforma). ' +
  'No decidas si se aprueba o rechaza — solo marca el riesgo para revisión humana.';

/** Adaptador de salida (ADR-010) — implementa IIAProvider con el SDK de Google (`@google/genai`,
 * Gemini Developer API). Sustituye a ClaudeAdapter como adapter cableado en producción desde
 * Sprint 5 por acceso a API key gratuita (decisión documentada en fase-07-inteligencia-artificial.md
 * historial — desvía de ADR-024, que eligió Claude/Anthropic). Modelos diferenciados por tarea, mismo
 * criterio que ClaudeAdapter: chatbot → `gemini-3.5-flash` (mejor calidad conversacional dentro del
 * tier Flash), resto → `gemini-3.5-flash-lite` (más barato/rápido, tareas acotadas de alto volumen). */
export class GeminiAdapter implements IIAProvider {
  private readonly client: GoogleGenAI | null;

  constructor(apiKey: string) {
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  private requerirCliente(): GoogleGenAI {
    if (!this.client) throw new IAProviderNoConfiguradoError();
    return this.client;
  }

  async chat(mensaje: string, historial: MensajeChat[]): Promise<string> {
    const client = this.requerirCliente();
    // Historial acotado a ~10-15 mensajes (RNF-002, Fase 7 sección 2).
    const contents: Content[] = historial.slice(-15).map((m) => ({
      role: m.rol === 'usuario' ? 'user' : 'model',
      parts: [{ text: m.texto }],
    }));
    contents.push({ role: 'user', parts: [{ text: mensaje }] });

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT_CHATBOT,
        maxOutputTokens: 1024,
      },
    });

    return response.text ?? '';
  }

  async clasificar(input: ClasificacionInput): Promise<ClasificacionResultado> {
    const client = this.requerirCliente();
    const propiedades: Record<string, unknown> = {
      tituloSugerido: { type: 'string' },
      descripcionSugerida: { type: 'string' },
    };
    const requeridos = ['tituloSugerido', 'descripcionSugerida'];
    if (input.esSolicitud) {
      propiedades.prioridadSugerida = { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA'] };
      requeridos.push('prioridadSugerida');
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Título: ${input.titulo}\nDescripción: ${input.descripcion}` }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_CLASIFICACION,
        responseMimeType: 'application/json',
        responseSchema: { type: 'object', properties: propiedades, required: requeridos },
        maxOutputTokens: 512,
      },
    });

    const resultado = parsearJSONDeIA<Record<string, unknown>>(response.text ?? '{}');
    return {
      tituloSugerido: String(resultado.tituloSugerido),
      descripcionSugerida: String(resultado.descripcionSugerida),
      prioridadSugerida: (resultado.prioridadSugerida as ClasificacionResultado['prioridadSugerida']) ?? null,
    };
  }

  async matchScore(origen: MatchCandidato, candidato: MatchCandidato): Promise<MatchResultado> {
    const client = this.requerirCliente();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `A: ${origen.titulo} — ${origen.descripcion}\nB: ${candidato.titulo} — ${candidato.descripcion}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_MATCHING,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: { score: { type: 'number' }, razon: { type: 'string' } },
          required: ['score', 'razon'],
        },
        maxOutputTokens: 256,
      },
    });

    const resultado = parsearJSONDeIA<{ score: number; razon: string }>(response.text ?? '{}');
    return { candidatoId: candidato.id, score: resultado.score, razon: resultado.razon };
  }

  async evaluarRiesgo(titulo: string, descripcion: string): Promise<EvaluarRiesgoResultado> {
    const client = this.requerirCliente();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [{ role: 'user', parts: [{ text: `Título: ${titulo}\nDescripción: ${descripcion}` }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT_MODERACION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            riesgoDetectado: { type: 'boolean' },
            categoriaRiesgo: {
              type: 'string',
              enum: ['CONTENIDO_INADECUADO', 'POSIBLE_FRAUDE', 'DATOS_SENSIBLES_EXPUESTOS'],
              nullable: true,
            },
            confianza: { type: 'number' },
            explicacion: { type: 'string' },
          },
          required: ['riesgoDetectado', 'categoriaRiesgo', 'confianza', 'explicacion'],
        },
        maxOutputTokens: 256,
      },
    });

    return parsearJSONDeIA<EvaluarRiesgoResultado>(response.text ?? '{}');
  }
}
