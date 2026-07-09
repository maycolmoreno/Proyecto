export const ESTADOS_CATEGORIA = ['ACTIVA', 'INACTIVA'] as const;
export type EstadoCategoria = (typeof ESTADOS_CATEGORIA)[number];
