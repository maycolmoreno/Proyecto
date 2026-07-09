import type { Request, Response, NextFunction } from 'express';
import { crearCategoriaSchema, actualizarCategoriaSchema, listarCategoriasQuerySchema } from './schemas.js';
import type { CrearCategoriaUseCase } from '@application/categorias/use-cases/CrearCategoriaUseCase.js';
import type { ListarCategoriasUseCase } from '@application/categorias/use-cases/ListarCategoriasUseCase.js';
import type { ActualizarCategoriaUseCase } from '@application/categorias/use-cases/ActualizarCategoriaUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class CategoriasController {
  constructor(
    private readonly crearCategoria: CrearCategoriaUseCase,
    private readonly listarCategorias: ListarCategoriasUseCase,
    private readonly actualizarCategoria: ActualizarCategoriaUseCase,
  ) {}

  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = crearCategoriaSchema.parse(req.body);
      const categoria = await this.crearCategoria.ejecutar(input);
      res.status(201).json({ data: categoria.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filtros = listarCategoriasQuerySchema.parse(req.query);
      const categorias = await this.listarCategorias.ejecutar(filtros);
      res.status(200).json({ data: categorias });
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = actualizarCategoriaSchema.parse(req.body);
      const categoria = await this.actualizarCategoria.ejecutar(req.params.id!, input);
      res.status(200).json({ data: categoria });
    } catch (error) {
      next(error);
    }
  };
}
