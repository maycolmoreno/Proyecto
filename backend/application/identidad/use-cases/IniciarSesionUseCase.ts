import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import type { IPasswordHasher } from '@domain/identidad/ports/IPasswordHasher.js';
import type { ITokenService } from '@domain/identidad/ports/ITokenService.js';
import type { UsuarioPublico } from '@domain/identidad/entities/Usuario.js';

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
  ) {}

  async ejecutar(input: IniciarSesionInput): Promise<IniciarSesionResult> {
    const usuario = await this.usuarioRepository.buscarPorCorreo(input.correo);
    if (!usuario) {
      throw new CredencialesInvalidasError();
    }

    const passwordValido = await this.passwordHasher.compare(input.password, usuario.passwordHash);
    if (!passwordValido) {
      throw new CredencialesInvalidasError();
    }

    if (!usuario.estaActivo()) {
      throw new UsuarioInactivoError();
    }

    const token = this.tokenService.generar({ sub: usuario.id, rol: usuario.rol });

    return { token, usuario: usuario.toJSON() };
  }
}
