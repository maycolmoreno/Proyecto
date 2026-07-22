export const ESTADOS_RESERVA = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'] as const;
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];
