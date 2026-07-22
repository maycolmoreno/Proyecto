import type { IUsuarioPerfilRepository } from '@domain/identidad/ports/IUsuarioPerfilRepository.js';
import type { PerfilFuncional } from '@domain/identidad/value-objects/PerfilFuncional.js';

/** PATCH /usuarios/me/perfiles (Opción D, Fase 2) — reemplaza el conjunto completo de perfiles del
 * usuario por el enviado (activar/desactivar), no incremental. Sin validación de rol: cualquier
 * autenticado administra sus propios perfiles (RegistrarUsuarioUseCase ya garantiza rol USUARIO
 * para el registro público; ADMINISTRADOR no gana capacidades de marketplace por esta vía). */
export class AsignarPerfilesUseCase {
  constructor(private readonly usuarioPerfilRepository: IUsuarioPerfilRepository) {}

  async ejecutar(usuarioId: string, perfilesDeseados: PerfilFuncional[]): Promise<PerfilFuncional[]> {
    const perfilesActuales = await this.usuarioPerfilRepository.listarPerfiles(usuarioId);

    const aAgregar = perfilesDeseados.filter((perfil) => !perfilesActuales.includes(perfil));
    const aQuitar = perfilesActuales.filter((perfil) => !perfilesDeseados.includes(perfil));

    await Promise.all([
      ...aAgregar.map((perfil) => this.usuarioPerfilRepository.asignarPerfil(usuarioId, perfil)),
      ...aQuitar.map((perfil) => this.usuarioPerfilRepository.quitarPerfil(usuarioId, perfil)),
    ]);

    return this.usuarioPerfilRepository.listarPerfiles(usuarioId);
  }
}
