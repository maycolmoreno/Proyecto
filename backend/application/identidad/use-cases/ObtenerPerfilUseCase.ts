import type { IUsuarioRepository } from '@domain/identidad/ports/IUsuarioRepository.js';
import type { IUsuarioPerfilRepository } from '@domain/identidad/ports/IUsuarioPerfilRepository.js';
import type { IUbicacionPerfilRepository, UbicacionPerfil } from '@domain/identidad/ports/IUbicacionPerfilRepository.js';
import type { UsuarioPublico } from '@domain/identidad/entities/Usuario.js';
import type { PerfilFuncional } from '@domain/identidad/value-objects/PerfilFuncional.js';

export class UsuarioNoEncontradoError extends Error {
  constructor() {
    super('Usuario no encontrado.');
    this.name = 'UsuarioNoEncontradoError';
  }
}

export interface PerfilPropioResponse extends UsuarioPublico {
  perfiles: PerfilFuncional[];
  ubicacion: UbicacionPerfil | null;
}

/** Consulta del perfil propio (GET /usuarios/me, Fase 4 sección 3 — BC-Identidad).
 * Opción D, Fase 2: incluye `perfiles` para que el frontend (Fase 3) pueda mostrarlos/editarlos.
 * `ubicacion` (nuevo): la ubicación de perfil guardada vía PATCH /usuarios/me/ubicacion, o `null`
 * si el usuario nunca la configuró — los wizards de publicación la usan como "ubicación registrada". */
export class ObtenerPerfilUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly usuarioPerfilRepository: IUsuarioPerfilRepository,
    private readonly ubicacionPerfilRepository: IUbicacionPerfilRepository,
  ) {}

  async ejecutar(usuarioId: string): Promise<PerfilPropioResponse> {
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new UsuarioNoEncontradoError();
    }
    const [perfiles, ubicacion] = await Promise.all([
      this.usuarioPerfilRepository.listarPerfiles(usuarioId),
      this.ubicacionPerfilRepository.obtener(usuarioId),
    ]);
    return { ...usuario.toJSON(), perfiles, ubicacion };
  }
}
