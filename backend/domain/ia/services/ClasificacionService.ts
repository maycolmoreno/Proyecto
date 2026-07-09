import type { IIAProvider, ClasificacionResultado } from '../ports/IIAProvider.js';
import type { ICategoriaRepository } from '@domain/categorias/ports/ICategoriaRepository.js';

export interface ClasificarInput {
  titulo: string;
  descripcion: string;
  esSolicitud: boolean;
}

/** Domain Service (Fase 2, sección 6) — CU-013/RF-015. Se dispara antes de publicar (Fase 7 sección
 * 3), por lo que no hay entidadId real todavía: no se persiste en `analisis_ia` (ver
 * docs/fases/fase-06-backend.md historial, Sprint 4) — el usuario decide usar la sugerencia o no
 * (ADR-010, human-in-the-loop). */
export class ClasificacionService {
  constructor(
    private readonly iaProvider: IIAProvider,
    private readonly categoriaRepository: ICategoriaRepository,
  ) {}

  async clasificar(input: ClasificarInput): Promise<ClasificacionResultado> {
    const categoriasVigentes = await this.categoriaRepository.listar({ estado: 'ACTIVA' });

    return this.iaProvider.clasificar({
      titulo: input.titulo,
      descripcion: input.descripcion,
      esSolicitud: input.esSolicitud,
      categoriasVigentes: categoriasVigentes.map((c) => c.nombre),
    });
  }
}
