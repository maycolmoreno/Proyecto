export const TIPOS_OPERACION_ENTREGA = ['DONACION', 'TRUEQUE'] as const;
export type TipoOperacionEntrega = (typeof TIPOS_OPERACION_ENTREGA)[number];
