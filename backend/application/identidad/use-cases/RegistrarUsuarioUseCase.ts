import { randomUUID } from 'node:crypto';
import { Usuario } from '@domain/identidad/entities/Usuario.js';
import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import type { IUsuarioPerfilRepository } from '@domain/identidad/ports/IUsuarioPerfilRepository.js';
import type { IPasswordHasher } from '@domain/identidad/ports/IPasswordHasher.js';
import type { PerfilFuncional } from '@domain/identidad/value-objects/PerfilFuncional.js';
import type { IEventBus } from '@domain/eventos/ports/IEventBus.js';

export interface RegistrarUsuarioInput {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  /** Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md) — reemplaza el antiguo campo `rol`.
   * El registro público nunca crea ADMINISTRADOR (antes posible, corregido aquí de paso: era
   * un endpoint sin autenticación que aceptaba cualquier valor del enum Rol de 4 valores). */
  perfiles: PerfilFuncional[];
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
    private readonly eventBus: IEventBus,
    private readonly usuarioPerfilRepository: IUsuarioPerfilRepository,
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
      rol: 'USUARIO',
    });

    await this.usuarioRepository.crear(usuario);
    await Promise.all(input.perfiles.map((perfil) => this.usuarioPerfilRepository.asignarPerfil(usuario.id, perfil)));

    this.eventBus.emit('UsuarioRegistrado', { id: usuario.id, nombre: usuario.nombre });

    return usuario;
  }
}
