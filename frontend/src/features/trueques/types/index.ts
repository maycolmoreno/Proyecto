// Tipos del dominio de Trueques — espejo de los DTOs de Fase 4 + backend real. A diferencia de
// Donación/Solicitud, Trueque no modela ubicación (TruequeCreateDTO no la incluye, Fase 4 sección 4).
export type EstadoObjeto = 'NUEVO' | 'BUEN_ESTADO' | 'USADO' | 'REQUIERE_REPARACION';
export type EstadoTrueque = 'PUBLICADO' | 'PROPUESTA_RECIBIDA' | 'ACEPTADO' | 'EN_COORDINACION' | 'INTERCAMBIADO' | 'CANCELADO';
export type EstadoPropuesta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface CategoriaResumen {
  id: string;
  nombre: string;
  tipo: string;
}

export interface Propuesta {
  id: string;
  truequeOfrecidoId: string;
  usuarioProponenteId: string;
  estado: EstadoPropuesta;
  fecha: string;
}

export interface Trueque {
  id: string;
  usuarioId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
  estadoTrueque: EstadoTrueque;
  imagenes: string[];
  fecha: string;
  propuestasRecibidas: Propuesta[];
}

export interface CrearTruequeInput {
  titulo: string;
  descripcion: string;
  categoriaId: string;
  estadoObjeto: EstadoObjeto;
}

export interface ProponerTruequeInput {
  truequeOfrecidoId: string;
}

export interface ListarTruequesFiltros {
  page?: number;
  limit?: number;
  estado?: EstadoTrueque;
  categoriaId?: string;
  sort?: 'fecha_asc' | 'fecha_desc';
}
