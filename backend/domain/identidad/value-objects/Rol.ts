// Fase 2 (BC-Identidad) — Value Object Rol. ADR-016: modelo RBAC estricto.
// Opción D (docs/DISENO_MODELO_PERFILES.md, Fase 2) — Rol se reduce a seguridad pura;
// la capacidad de marketplace (antes DONANTE/BENEFICIARIO/USUARIO_COMUNIDAD) vive ahora en
// PerfilFuncional (domain/identidad/value-objects/PerfilFuncional.ts).
export const ROLES = ['ADMINISTRADOR', 'USUARIO'] as const;

export type Rol = (typeof ROLES)[number];
