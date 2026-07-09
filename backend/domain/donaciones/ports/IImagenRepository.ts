export type TipoEntidadImagen = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

export interface CrearImagenInput {
  tipoEntidad: TipoEntidadImagen;
  idEntidad: string;
  url: string;
  publicId: string;
}

/** Puerto de salida — implementado en adapters/repositories/PrismaImagenRepository (Fase 6, sección 4). */
export interface IImagenRepository {
  crear(input: CrearImagenInput): Promise<void>;
  listarUrlsPorEntidad(tipoEntidad: TipoEntidadImagen, idEntidad: string): Promise<string[]>;
}
