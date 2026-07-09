import type { UbicacionInput } from '@shared/lib/ubicacion';

// Tipos del dominio de Solicitudes — espejo de los DTOs de Fase 4 + backend real.
export type Urgencia = 'BAJA' | 'MEDIA' | 'ALTA';
export type EstadoSolicitud = 'ABIERTA' | 'EN_REVISION' | 'ACEPTADA_POR_DONANTE' | 'EN_ENTREGA' | 'ATENDIDA' | 'CANCELADA';
export type EstadoOferta = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface CategoriaResumen {
  id: string;
  nombre: string;
  tipo: string;
}

export interface Ubicacion {
  provincia: string;
  ciudad: string;
  sector: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface Oferta {
  id: string;
  donanteId: string;
  donacionId: string;
  mensaje: string | null;
  estado: EstadoOferta;
  fecha: string;
}

export interface Solicitud {
  id: string;
  beneficiarioId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  urgencia: Urgencia;
  estadoSolicitud: EstadoSolicitud;
  ubicacion: Ubicacion;
  evidenciaUrl: string | null;
  fecha: string;
  ofertas: Oferta[];
}

export interface CrearSolicitudInput {
  titulo: string;
  descripcion: string;
  categoriaId: string;
  urgencia: Urgencia;
  ubicacion: UbicacionInput;
  evidenciaUrl?: string;
}

export interface CrearOfertaInput {
  donacionId: string;
  mensaje?: string;
}

export interface ListarSolicitudesFiltros {
  page?: number;
  limit?: number;
  estado?: EstadoSolicitud;
  categoriaId?: string;
  urgencia?: Urgencia;
  provincia?: string;
  ciudad?: string;
  sort?: 'fecha_asc' | 'fecha_desc';
}
