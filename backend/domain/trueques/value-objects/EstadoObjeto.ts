// Mismos 4 valores que domain/donaciones/value-objects/EstadoObjeto.ts — se duplica deliberadamente
// (cada módulo es dueño de su propio value-object, mismo criterio que Sprint 1/2 para no acoplar
// Bounded Contexts vía imports cruzados de domain/, aunque la forma coincida).
export const ESTADOS_OBJETO = ['NUEVO', 'BUEN_ESTADO', 'USADO', 'REQUIERE_REPARACION'] as const;
export type EstadoObjeto = (typeof ESTADOS_OBJETO)[number];
