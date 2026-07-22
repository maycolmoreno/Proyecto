import type { Request, Response, NextFunction } from 'express';
import { agregarFavoritoSchema, parametrosFavoritoSchema } from './schemas.js';
import type { AgregarFavoritoUseCase } from '@application/favoritos/use-cases/AgregarFavoritoUseCase.js';
import type { QuitarFavoritoUseCase } from '@application/favoritos/use-cases/QuitarFavoritoUseCase.js';
import type { ListarFavoritosUseCase } from '@application/favoritos/use-cases/ListarFavoritosUseCase.js';

/** Adaptador de entrada (Hexagonal) — traduce HTTP a invocaciones de caso de uso. Sin lógica de negocio. */
export class FavoritosController {
  constructor(
    private readonly agregarFavoritoUseCase: AgregarFavoritoUseCase,
    private readonly quitarFavoritoUseCase: QuitarFavoritoUseCase,
    private readonly listarFavoritosUseCase: ListarFavoritosUseCase,
  ) {}

  agregar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = agregarFavoritoSchema.parse(req.body);
      await this.agregarFavoritoUseCase.ejecutar(req.usuario!.sub, input);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  quitar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tipoEntidad, entidadId } = parametrosFavoritoSchema.parse(req.params);
      await this.quitarFavoritoUseCase.ejecutar(req.usuario!.sub, tipoEntidad, entidadId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const favoritos = await this.listarFavoritosUseCase.ejecutar(req.usuario!.sub);
      res.status(200).json({ data: favoritos });
    } catch (error) {
      next(error);
    }
  };
}
