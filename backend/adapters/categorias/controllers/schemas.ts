import { z } from 'zod';
import { ESTADOS_CATEGORIA } from '@domain/categorias/value-objects/EstadoCategoria.js';

// Fase 4, sección 3 (BC-Categorías).
export const crearCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100),
  tipo: z.string().min(1).max(50),
});

export const actualizarCategoriaSchema = z
  .object({
    nombre: z.string().min(1).max(100).optional(),
    tipo: z.string().min(1).max(50).optional(),
    estado: z.enum(ESTADOS_CATEGORIA).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe incluir al menos un campo a actualizar.' });

export const listarCategoriasQuerySchema = z.object({
  estado: z.enum(ESTADOS_CATEGORIA).optional(),
});
