export const ESTADOS_OFERTA = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'] as const;
export type EstadoOferta = (typeof ESTADOS_OFERTA)[number];
