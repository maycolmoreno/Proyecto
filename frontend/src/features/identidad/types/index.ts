// Tipos del dominio de Identidad en el frontend — espejo de los DTOs de Fase 4.
export type Rol = 'ADMINISTRADOR' | 'DONANTE' | 'BENEFICIARIO' | 'USUARIO_COMUNIDAD';

export interface UsuarioPublico {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: Rol;
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
  fechaCreacion: string;
}

export interface RegistroInput {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  rol: Rol;
  aceptaTerminos: true;
}

export interface LoginInput {
  correo: string;
  password: string;
}

export interface LoginResult {
  token: string;
  usuario: UsuarioPublico;
}
