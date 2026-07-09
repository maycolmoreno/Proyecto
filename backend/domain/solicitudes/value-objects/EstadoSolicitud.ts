export const ESTADOS_SOLICITUD = [
  'ABIERTA',
  'EN_REVISION',
  'ACEPTADA_POR_DONANTE',
  'EN_ENTREGA',
  'ATENDIDA',
  'CANCELADA',
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

const ESTADOS_TERMINALES: readonly EstadoSolicitud[] = ['ATENDIDA', 'CANCELADA'];

export function esEstadoTerminal(estado: EstadoSolicitud): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}
