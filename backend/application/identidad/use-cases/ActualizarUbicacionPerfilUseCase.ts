import type {
  GuardarUbicacionPerfilInput,
  IUbicacionPerfilRepository,
  UbicacionPerfil,
} from '@domain/identidad/ports/IUbicacionPerfilRepository.js';

/** PATCH /usuarios/me/ubicacion — guarda o actualiza la ubicación de perfil del usuario
 * autenticado (upsert, delegado enteramente al repositorio, mismo molde que
 * AsignarPerfilesUseCase). Usada luego por los wizards de Donación/Solicitud como "ubicación
 * registrada" alternativa a cargar una nueva en cada publicación. */
export class ActualizarUbicacionPerfilUseCase {
  constructor(private readonly ubicacionPerfilRepository: IUbicacionPerfilRepository) {}

  async ejecutar(usuarioId: string, input: GuardarUbicacionPerfilInput): Promise<UbicacionPerfil> {
    return this.ubicacionPerfilRepository.guardar(usuarioId, input);
  }
}
