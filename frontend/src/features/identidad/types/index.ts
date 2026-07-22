import type { UbicacionInput } from '@shared/lib/ubicacion';

// Tipos del dominio de Identidad en el frontend — espejo de los DTOs de Fase 4.
// Opción D (docs/DISENO_MODELO_PERFILES.md, Fase 2/3) — Rol se redujo a seguridad pura; la
// capacidad de marketplace vive en PerfilFuncional, independiente y multivaluada por usuario.
export type Rol = 'ADMINISTRADOR' | 'USUARIO';
// COMUNIDAD removido (ADR-049) — separado hasta que se priorice como agregado `Organizacion`.
export type PerfilFuncional = 'DONANTE' | 'SOLICITANTE' | 'TRUEQUE';

export interface UsuarioPublico {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: Rol;
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
  fechaCreacion: string;
}

/** GET /usuarios/me únicamente — a diferencia de /auth/registro y /auth/login (usuario.toJSON(),
 * sin perfiles), este endpoint sí los incluye (ObtenerPerfilUseCase, Opción D Fase 2).
 * `ubicacion`: la ubicación de perfil guardada vía PATCH /usuarios/me/ubicacion, o `null` si el
 * usuario nunca la configuró — usada por los wizards como "ubicación registrada". */
export interface PerfilPropio extends UsuarioPublico {
  perfiles: PerfilFuncional[];
  ubicacion: UbicacionInput | null;
}

export interface RegistroInput {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  perfiles: PerfilFuncional[];
  aceptaTerminos: true;
}

export interface ActualizarPerfilesInput {
  perfiles: PerfilFuncional[];
}

export interface LoginInput {
  correo: string;
  password: string;
}

export interface LoginResult {
  token: string;
  usuario: UsuarioPublico;
}
