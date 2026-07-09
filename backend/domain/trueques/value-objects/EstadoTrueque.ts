export const ESTADOS_TRUEQUE = [
  'PUBLICADO',
  'PROPUESTA_RECIBIDA',
  'ACEPTADO',
  'EN_COORDINACION',
  'INTERCAMBIADO',
  'CANCELADO',
] as const;
export type EstadoTrueque = (typeof ESTADOS_TRUEQUE)[number];

const ESTADOS_TERMINALES: readonly EstadoTrueque[] = ['INTERCAMBIADO', 'CANCELADO'];

export function esEstadoTerminal(estado: EstadoTrueque): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}
