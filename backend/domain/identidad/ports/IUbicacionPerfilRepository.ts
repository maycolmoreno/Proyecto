export interface UbicacionPerfil {
  provincia: string;
  ciudad: string;
  sector: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
}

export interface GuardarUbicacionPerfilInput {
  provincia: string;
  ciudad: string;
  sector?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

/** Puerto de salida — ubicación de perfil (tipo PERFIL, distinta de RETIRO/ESTABLECIDA que ya usan
 * Donación/Solicitud para su propia ubicación puntual). `guardar` hace upsert: a diferencia de
 * Donación/Solicitud (que crean una fila nueva por publicación, nunca editada), la ubicación de
 * perfil es un dato editable — no debe acumular filas huérfanas en cada edición. Implementado en
 * adapters/identidad/repositories/PrismaUbicacionPerfilRepository. */
export interface IUbicacionPerfilRepository {
  obtener(usuarioId: string): Promise<UbicacionPerfil | null>;
  guardar(usuarioId: string, input: GuardarUbicacionPerfilInput): Promise<UbicacionPerfil>;
}
