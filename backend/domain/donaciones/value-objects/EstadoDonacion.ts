export const ESTADOS_DONACION = [
  'PUBLICADA',
  'SOLICITADA',
  'APROBADA',
  'EN_RETIRO',
  'ENTREGADA',
  'CANCELADA',
] as const;
export type EstadoDonacion = (typeof ESTADOS_DONACION)[number];

const ESTADOS_TERMINALES: readonly EstadoDonacion[] = ['ENTREGADA', 'CANCELADA'];

export function esEstadoTerminal(estado: EstadoDonacion): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}
