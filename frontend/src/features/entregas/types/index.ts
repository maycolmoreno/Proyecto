// Tipos del dominio de Entregas — espejo de los DTOs de Fase 4 + backend real.
export type TipoOperacionEntrega = 'DONACION' | 'TRUEQUE';
export type ModalidadEntrega = 'RETIRO_DOMICILIO' | 'ENTREGA_DIRECTA' | 'PUNTO_ENCUENTRO';
export type EstadoEntrega = 'PROGRAMADA' | 'CONFIRMADA' | 'CANCELADA';

export interface Entrega {
  id: string;
  tipoOperacion: TipoOperacionEntrega;
  idReferencia: string;
  modalidad: ModalidadEntrega;
  estado: EstadoEntrega;
  fechaProgramada: string | null;
}
