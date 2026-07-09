import type { IIAProvider } from '../ports/IIAProvider.js';
import type { IAnalisisIARepository, TipoEntidadIA } from '../ports/IAnalisisIARepository.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

export interface EvaluarPublicacionInput {
  tipoEntidad: TipoEntidadIA;
  entidadId: string;
  titulo: string;
  descripcion: string;
}

/** Domain Service (Fase 2, sección 6) — moderación asistida por IA (Fase 7 sección 5, ADR-027).
 * Primer listener real del Event Bus (main/event-bus.ts): se registra en el composition root sobre
 * `DonacionPublicada`/`SolicitudCreada`/`TruequePublicado`. Nunca decide, solo marca para revisión
 * humana — no bloquea ni elimina automáticamente la publicación. */
export class ModeracionIAService {
  constructor(
    private readonly iaProvider: IIAProvider,
    private readonly analisisRepository: IAnalisisIARepository,
    private readonly eventBus: IEventBus,
  ) {}

  async evaluarYRegistrar(input: EvaluarPublicacionInput): Promise<void> {
    const resultado = await this.iaProvider.evaluarRiesgo(input.titulo, input.descripcion);

    await this.analisisRepository.registrar({
      tipo: 'MODERACION',
      tipoEntidad: input.tipoEntidad,
      entidadId: input.entidadId,
      prompt: `Título: ${input.titulo}\nDescripción: ${input.descripcion}`,
      respuestaIA: resultado.explicacion,
      categoriaSugerida: null,
      prioridad: null,
      score: null,
      riesgoDetectado: resultado.riesgoDetectado,
      categoriaRiesgo: resultado.categoriaRiesgo,
      confianza: resultado.confianza,
      explicacion: resultado.explicacion,
      fecha: new Date(),
    });

    if (resultado.riesgoDetectado) {
      this.eventBus.emit('RiesgoDetectado', {
        tipoEntidad: input.tipoEntidad,
        entidadId: input.entidadId,
        categoriaRiesgo: resultado.categoriaRiesgo,
        confianza: resultado.confianza,
      });
    }
  }
}
