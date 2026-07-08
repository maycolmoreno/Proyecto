import { randomUUID } from 'node:crypto';
import { Usuario } from '../../domain/entities/Usuario.js';
import type { IUsuarioRepository } from '../../domain/ports/IUsuarioRepository.js';
import type { IPasswordHasher } from '../../domain/ports/IPasswordHasher.js';
import type { Rol } from '../../domain/value-objects/Rol.js';

export interface RegistrarUsuarioInput {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  rol: Rol;
}

export class CorreoYaRegistradoError extends Error {
  constructor(correo: string) {
    super(`El correo ${correo} ya está registrado.`);
    this.name = 'CorreoYaRegistradoError';
  }
}

/** CU-001 Registrarse (RF-001) — orquesta el dominio vía puertos, sin conocer Prisma/bcrypt. */
export class RegistrarUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async ejecutar(input: RegistrarUsuarioInput): Promise<Usuario> {
    const existente = await this.usuarioRepository.buscarPorCorreo(input.correo);
    if (existente) {
      throw new CorreoYaRegistradoError(input.correo);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const usuario = Usuario.crear({
      id: randomUUID(),
      nombre: input.nombre,
      correo: input.correo,
      passwordHash,
      telefono: input.telefono,
      rol: input.rol,
    });

    await this.usuarioRepository.crear(usuario);

    // TODO(Sprint 1): publicar UsuarioRegistrado vía IEventPublisher cuando exista
    // el primer listener real (NotificacionDispatchService, Fase 6 sección 5).

    return usuario;
  }
}
