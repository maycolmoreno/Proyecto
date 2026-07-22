// Función pura (Fase 1, sección 9.2): deriva el grupo semántico de un estado de negocio.
// Mapeo exacto de Fase 5, sección 4.2.
export type GrupoEstado = 'neutral' | 'progreso' | 'exito' | 'cancelado';

const ESTADOS_POR_GRUPO: Record<GrupoEstado, readonly string[]> = {
  neutral: ['PUBLICADA', 'ABIERTA', 'PUBLICADO', 'ACTIVO'],
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
    'PROGRAMADA',
  ],
  exito: ['APROBADA', 'ENTREGADA', 'ATENDIDA', 'INTERCAMBIADO', 'ACEPTADA', 'CONFIRMADA'],
  cancelado: ['CANCELADA', 'CANCELADO', 'RECHAZADA', 'SUSPENDIDO', 'ELIMINADO'],
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

// Mismo catálogo que DonacionWizard/TruequeWizard (EstadoObjeto es idéntico en ambos dominios) —
// centralizado acá para los detalles, que capturan la condición al crear pero no la mostraban
// (auditoría de espacio muerto 2026-07-21).
const ETIQUETAS_ESTADO_OBJETO: Record<string, string> = {
  NUEVO: 'Nuevo',
  BUEN_ESTADO: 'Buen estado',
  USADO: 'Usado',
  REQUIERE_REPARACION: 'Requiere reparación',
};

export function etiquetaEstadoObjeto(estadoObjeto: string): string {
  return ETIQUETAS_ESTADO_OBJETO[estadoObjeto] ?? estadoObjeto;
}
