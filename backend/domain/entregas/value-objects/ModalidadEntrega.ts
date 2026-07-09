export const MODALIDADES_ENTREGA = ['RETIRO_DOMICILIO', 'ENTREGA_DIRECTA', 'PUNTO_ENCUENTRO'] as const;
export type ModalidadEntrega = (typeof MODALIDADES_ENTREGA)[number];
