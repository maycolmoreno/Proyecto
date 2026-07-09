import Anthropic from '@anthropic-ai/sdk';
import {
  IAProviderNoConfiguradoError,
  type IIAProvider,
  type MensajeChat,
  type ClasificacionInput,
  type ClasificacionResultado,
  type MatchCandidato,
  type MatchResultado,
  type EvaluarRiesgoResultado,
} from '@domain/ia/ports/IIAProvider.js';

export { IAProviderNoConfiguradoError };

const SYSTEM_PROMPT_CHATBOT = `Rol: Asistente de DonaConnect Ecuador.
Alcance: orientar sobre donaciones, solicitudes, trueques, categorías, seguridad y funcionamiento de la plataforma.
Fuera de alcance: no das asesoría legal/médica/financiera; no verificas la condición socioeconómica de nadie (declara esto si te lo preguntan).
Estilo: español, claro, breve.`;

const SYSTEM_PROMPT_CLASIFICACION =
  'Dado el título y descripción de una publicación, sugiere una categoría (EXACTAMENTE una de las vigentes indicadas), ' +
  'un título y una descripción mejorados (mismo idioma), y si se indica que es una solicitud, una prioridad. ' +
  'Responde solo en el formato JSON solicitado.';

const SYSTEM_PROMPT_MATCHING =
  'Compara la publicación A contra el candidato B (ya filtrados por categoría/ubicación/estado). ' +
  'Da un score 0-1 de qué tan bien B satisface la necesidad/objeto de A, y una razón breve.';

const SYSTEM_PROMPT_MODERACION =
  'Evalúa si esta publicación podría ser contenido inadecuado, fraudulento, peligroso o exponer datos sensibles ' +
  '(direcciones exactas, números de identificación, contacto directo fuera de la plataforma). ' +
  'No decidas si se aprueba o rechaza — solo marca el riesgo para revisión humana.';

function extraerTexto(content: Anthropic.ContentBlock[]): string {
  const bloque = content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return bloque?.text ?? '';
}

/** Adaptador de salida (ADR-010/024) — implementa IIAProvider con el SDK de Anthropic.
 * Modelos diferenciados por tarea (Fase 7, sección 1): chatbot → Sonnet 5, resto → Haiku 4.5. */
export class ClaudeAdapter implements IIAProvider {
  private readonly client: Anthropic | null;

  constructor(apiKey: string) {
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  private requerirCliente(): Anthropic {
    if (!this.client) throw new IAProviderNoConfiguradoError();
    return this.client;
  }

  async chat(mensaje: string, historial: MensajeChat[]): Promise<string> {
    const client = this.requerirCliente();
    // Historial acotado a ~10-15 mensajes (RNF-002, Fase 7 sección 2).
    const mensajesRecientes: Anthropic.MessageParam[] = historial.slice(-15).map((m) => ({
      role: m.rol === 'usuario' ? 'user' : 'assistant',
      content: m.texto,
    }));

    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: [{ type: 'text', text: SYSTEM_PROMPT_CHATBOT, cache_control: { type: 'ephemeral' } }],
      messages: [...mensajesRecientes, { role: 'user', content: mensaje }],
    });

    return extraerTexto(response.content);
  }

  async clasificar(input: ClasificacionInput): Promise<ClasificacionResultado> {
    const client = this.requerirCliente();
    const propiedades: Record<string, unknown> = {
      categoriaSugerida: { type: 'string', enum: input.categoriasVigentes },
      tituloSugerido: { type: 'string' },
      descripcionSugerida: { type: 'string' },
    };
    const requeridos = ['categoriaSugerida', 'tituloSugerido', 'descripcionSugerida'];
    if (input.esSolicitud) {
      propiedades.prioridadSugerida = { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA'] };
      requeridos.push('prioridadSugerida');
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: [{ type: 'text', text: SYSTEM_PROMPT_CLASIFICACION, cache_control: { type: 'ephemeral' } }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: { type: 'object', properties: propiedades, required: requeridos, additionalProperties: false },
        },
      },
      messages: [
        {
          role: 'user',
          content: `Categorías vigentes: ${input.categoriasVigentes.join(', ')}\nTítulo: ${input.titulo}\nDescripción: ${input.descripcion}`,
        },
      ],
    });

    const resultado = JSON.parse(extraerTexto(response.content)) as Record<string, unknown>;
    return {
      categoriaSugerida: String(resultado.categoriaSugerida),
      tituloSugerido: String(resultado.tituloSugerido),
      descripcionSugerida: String(resultado.descripcionSugerida),
      prioridadSugerida: (resultado.prioridadSugerida as ClasificacionResultado['prioridadSugerida']) ?? null,
    };
  }

  async matchScore(origen: MatchCandidato, candidato: MatchCandidato): Promise<MatchResultado> {
    const client = this.requerirCliente();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: [{ type: 'text', text: SYSTEM_PROMPT_MATCHING, cache_control: { type: 'ephemeral' } }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: { score: { type: 'number' }, razon: { type: 'string' } },
            required: ['score', 'razon'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'user',
          content: `A: ${origen.titulo} — ${origen.descripcion}\nB: ${candidato.titulo} — ${candidato.descripcion}`,
        },
      ],
    });

    const resultado = JSON.parse(extraerTexto(response.content)) as { score: number; razon: string };
    return { candidatoId: candidato.id, score: resultado.score, razon: resultado.razon };
  }

  async evaluarRiesgo(titulo: string, descripcion: string): Promise<EvaluarRiesgoResultado> {
    const client = this.requerirCliente();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: [{ type: 'text', text: SYSTEM_PROMPT_MODERACION, cache_control: { type: 'ephemeral' } }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              riesgoDetectado: { type: 'boolean' },
              categoriaRiesgo: {
                type: ['string', 'null'],
                enum: ['CONTENIDO_INADECUADO', 'POSIBLE_FRAUDE', 'DATOS_SENSIBLES_EXPUESTOS', null],
              },
              confianza: { type: 'number' },
              explicacion: { type: 'string' },
            },
            required: ['riesgoDetectado', 'categoriaRiesgo', 'confianza', 'explicacion'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: `Título: ${titulo}\nDescripción: ${descripcion}` }],
    });

    return JSON.parse(extraerTexto(response.content)) as EvaluarRiesgoResultado;
  }
}
