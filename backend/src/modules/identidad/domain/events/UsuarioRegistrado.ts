// Fase 2, sección 7 (eventos de dominio). Sin listeners todavía en Sprint 0 —
// se conecta al Event Bus (ADR-023) cuando exista el primer consumidor real (Sprint 1+).
export interface UsuarioRegistrado {
  type: 'UsuarioRegistrado';
  usuarioId: string;
  ocurridoEn: Date;
}

export function crearEventoUsuarioRegistrado(usuarioId: string): UsuarioRegistrado {
  return { type: 'UsuarioRegistrado', usuarioId, ocurridoEn: new Date() };
}
