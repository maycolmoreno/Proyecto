// Función pura (Fase 1, sección 9.2): deriva el grupo semántico de un estado de negocio.
// Mapeo exacto de Fase 5, sección 4.2.
export type GrupoEstado = 'neutral' | 'progreso' | 'exito' | 'cancelado';

const ESTADOS_POR_GRUPO: Record<GrupoEstado, readonly string[]> = {
  neutral: ['PUBLICADA', 'ABIERTA', 'PUBLICADO'],
  progreso: [
    'SOLICITADA',
    'EN_REVISION',
    'ACEPTADA_POR_DONANTE',
    'EN_RETIRO',
    'EN_ENTREGA',
    'PROPUESTA_RECIBIDA',
    'ACEPTADO',
    'EN_COORDINACION',
    'PENDIENTE',
  ],
  exito: ['APROBADA', 'ENTREGADA', 'ATENDIDA', 'INTERCAMBIADO', 'ACEPTADA'],
  cancelado: ['CANCELADA', 'CANCELADO', 'RECHAZADA'],
};

export function grupoDeEstado(estado: string): GrupoEstado {
  for (const [grupo, estados] of Object.entries(ESTADOS_POR_GRUPO)) {
    if (estados.includes(estado)) return grupo as GrupoEstado;
  }
  return 'neutral';
}

export type Urgencia = 'BAJA' | 'MEDIA' | 'ALTA';

export function claseUrgencia(urgencia: Urgencia): string {
  return `badge badge--urgencia-${urgencia.toLowerCase()}`;
}
