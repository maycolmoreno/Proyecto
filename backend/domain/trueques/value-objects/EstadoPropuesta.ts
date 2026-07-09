export const ESTADOS_PROPUESTA = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'] as const;
export type EstadoPropuesta = (typeof ESTADOS_PROPUESTA)[number];
