export const ESTADOS_ENTREGA = ['PROGRAMADA', 'CONFIRMADA', 'CANCELADA'] as const;
export type EstadoEntrega = (typeof ESTADOS_ENTREGA)[number];

const ESTADOS_TERMINALES: readonly EstadoEntrega[] = ['CONFIRMADA', 'CANCELADA'];

export function esEstadoTerminal(estado: EstadoEntrega): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}
