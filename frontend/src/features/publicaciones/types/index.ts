// Tipos del dominio de Publicaciones — espejo de IPublicacionIndexRepository (Fase 5 diferida,
// docs/DISENO_MODELO_PERFILES.md sección 7).
export type TipoPublicacion = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

export interface PublicacionIndexEntry {
  id: string;
  tipo: TipoPublicacion;
  titulo: string;
  estado: string;
  usuarioId: string;
  fecha: string;
  actualizadoEn: string;
}
