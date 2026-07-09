export const ESTADOS_OBJETO = ['NUEVO', 'BUEN_ESTADO', 'USADO', 'REQUIERE_REPARACION'] as const;
export type EstadoObjeto = (typeof ESTADOS_OBJETO)[number];
