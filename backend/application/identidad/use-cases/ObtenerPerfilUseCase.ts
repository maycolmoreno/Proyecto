import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import type { UsuarioPublico } from '@domain/identidad/entities/Usuario.js';

export class UsuarioNoEncontradoError extends Error {
  constructor() {
    super('Usuario no encontrado.');
    this.name = 'UsuarioNoEncontradoError';
  }
}

/** Consulta del perfil propio (GET /usuarios/me, Fase 4 sección 3 — BC-Identidad). */
export class ObtenerPerfilUseCase {
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async ejecutar(usuarioId: string): Promise<UsuarioPublico> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new UsuarioNoEncontradoError();
    }
    return usuario.toJSON();
  }
}
