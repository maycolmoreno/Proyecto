import type { UbicacionInput } from '@shared/lib/ubicacion';

// Tipos del dominio de Donaciones — espejo de los DTOs de Fase 4 + backend real.
export type EstadoObjeto = 'NUEVO' | 'BUEN_ESTADO' | 'USADO' | 'REQUIERE_REPARACION';
export type EstadoDonacion = 'PUBLICADA' | 'SOLICITADA' | 'APROBADA' | 'EN_RETIRO' | 'ENTREGADA' | 'CANCELADA';

export interface CategoriaResumen {
  id: string;
  nombre: string;
  tipo: string;
}

export interface UbicacionRetiro {
  provincia: string;
  ciudad: string;
  sector: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface Donacion {
  id: string;
  donanteId: string;
  categoria: CategoriaResumen;
  titulo: string;
  descripcion: string;
  estadoObjeto: EstadoObjeto;
  estadoDonacion: EstadoDonacion;
  requiereRetiro: boolean;
  ubicacionRetiro: UbicacionRetiro | null;
  imagenes: string[];
  fecha: string;
}

export interface CrearDonacionInput {
  titulo: string;
  descripcion: string;
  categoriaId: string;
  estadoObjeto: EstadoObjeto;
  requiereRetiro: boolean;
  ubicacionRetiro?: UbicacionInput;
}

export interface ActualizarDonacionInput {
  titulo?: string;
  descripcion?: string;
  estadoObjeto?: EstadoObjeto;
}

export interface ListarDonacionesFiltros {
  page?: number;
  limit?: number;
  estado?: EstadoDonacion;
  categoriaId?: string;
  provincia?: string;
  ciudad?: string;
  sort?: 'fecha_asc' | 'fecha_desc';
}
