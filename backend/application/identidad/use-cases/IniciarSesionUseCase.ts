import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import type { IPasswordHasher } from '@domain/identidad/ports/IPasswordHasher.js';
import type { ITokenService } from '@domain/identidad/ports/ITokenService.js';
import type { UsuarioPublico } from '@domain/identidad/entities/Usuario.js';
import type { IAuditoriaRepository } from '@domain/auditoria/ports/IAuditoriaRepository.js';

export interface IniciarSesionInput {
  correo: string;
  password: string;
}

export interface IniciarSesionResult {
  token: string;
  usuario: UsuarioPublico;
}

export class CredencialesInvalidasError extends Error {
  constructor() {
    super('Correo o contraseña incorrectos.');
    this.name = 'CredencialesInvalidasError';
  }
}

export class UsuarioInactivoError extends Error {
  constructor() {
    super('El usuario no está activo.');
    this.name = 'UsuarioInactivoError';
  }
}

/** CU-002 Iniciar sesión (RF-002). */
export class IniciarSesionUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly auditoriaRepository: IAuditoriaRepository,
  ) {}

  async ejecutar(input: IniciarSesionInput): Promise<IniciarSesionResult> {
    const usuario = await this.usuarioRepository.buscarPorCorreo(input.correo);
    if (!usuario) {
      // Sin id_entidad válido (no existe el usuario) — la tabla auditoria exige id_entidad NOT NULL
      // (Fase 3), así que este intento no se registra ahí (Fase 9, sección 3, deja el caso ambiguo).
      throw new CredencialesInvalidasError();
    }

    const passwordValido = await this.passwordHasher.compare(input.password, usuario.passwordHash);
    if (!passwordValido) {
      // Best-effort: un fallo al auditar no debe convertir un login inválido en un 500, y application/
      // no puede depender del logger de main/ (regla de dependencia, Fase 6 sección 1).
      await this.auditoriaRepository
        .registrar({ idUsuario: usuario.id, accion: 'LOGIN_FALLIDO', entidad: 'USUARIO', idEntidad: usuario.id })
        .catch(() => undefined);
      throw new CredencialesInvalidasError();
    }

    if (!usuario.estaActivo()) {
      throw new UsuarioInactivoError();
    }

    const token = this.tokenService.generar({ sub: usuario.id, rol: usuario.rol });

    return { token, usuario: usuario.toJSON() };
  }
}
