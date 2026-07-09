// Tipos del dominio de IA (clasificación + matching) — espejo de IIAProvider (Fase 4, sección 3).
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';
export type EntidadTipoIA = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

export interface ClasificarInput {
  titulo: string;
  descripcion: string;
  esSolicitud: boolean;
}

export interface ClasificacionResultado {
  categoriaSugerida: string;
  tituloSugerido: string;
  descripcionSugerida: string;
  prioridadSugerida: Prioridad | null;
}

export interface MatchResultado {
  candidatoId: string;
  score: number;
  razon: string;
}
