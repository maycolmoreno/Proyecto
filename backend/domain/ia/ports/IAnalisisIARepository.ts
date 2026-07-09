export type TipoAnalisisIA = 'CLASIFICACION' | 'MODERACION';
export type TipoEntidadIA = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

export interface AnalisisIA {
  tipo: TipoAnalisisIA;
  tipoEntidad: TipoEntidadIA;
  entidadId: string;
  prompt: string;
  respuestaIA: string;
  categoriaSugerida: string | null;
  prioridad: string | null;
  score: number | null;
  riesgoDetectado: boolean | null;
  categoriaRiesgo: string | null;
  confianza: number | null;
  explicacion: string | null;
  fecha: Date;
}

/** Puerto de salida — MongoDB (Fase 3, `analisis_ia`). Implementado en
 * adapters/ia/repositories/MongooseAnalisisIARepository. Extendido en Sprint 4 con
 * riesgoDetectado/categoriaRiesgo/confianza/explicacion para moderación (Fase 7 sección 5) —
 * campos no listados en el sketch original de Fase 3 §7.1.2 (solo cubría clasificación/matching)
 * pero coherentes con su propósito de "log de análisis IA"; Mongo no fuerza schema. */
export interface IAnalisisIARepository {
  registrar(input: AnalisisIA): Promise<void>;
  listarConRiesgo(): Promise<AnalisisIA[]>;
}
