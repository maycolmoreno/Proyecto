import type { IIAProvider, ClasificacionResultado } from '../ports/IIAProvider.js';

export interface ClasificarInput {
  titulo: string;
  descripcion: string;
  esSolicitud: boolean;
}

/** Domain Service (Fase 2, sección 6) — CU-013/RF-015. Se dispara antes de publicar (Fase 7 sección
 * 3), por lo que no hay entidadId real todavía: no se persiste en `analisis_ia` (ver
 * docs/fases/fase-06-backend.md historial, Sprint 4) — el usuario decide usar la sugerencia o no
 * (ADR-010, human-in-the-loop). No sugiere categoría (2026-07-21): eso lo decide siempre la
 * persona en el wizard. */
export class ClasificacionService {
  constructor(private readonly iaProvider: IIAProvider) {}

  async clasificar(input: ClasificarInput): Promise<ClasificacionResultado> {
    return this.iaProvider.clasificar({
      titulo: input.titulo,
      descripcion: input.descripcion,
      esSolicitud: input.esSolicitud,
    });
  }
}
