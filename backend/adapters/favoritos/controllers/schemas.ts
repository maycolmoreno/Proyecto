import { z } from 'zod';

const TIPOS_ENTIDAD_FAVORITO = ['DONACION', 'SOLICITUD', 'TRUEQUE'] as const;

export const agregarFavoritoSchema = z.object({
  tipoEntidad: z.enum(TIPOS_ENTIDAD_FAVORITO),
  entidadId: z.string().uuid(),
});

export const parametrosFavoritoSchema = z.object({
  tipoEntidad: z.enum(TIPOS_ENTIDAD_FAVORITO),
  entidadId: z.string().uuid(),
});
