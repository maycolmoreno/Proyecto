// Fase 2 (BC-Identidad) — Value Object Rol. ADR-016: modelo RBAC estricto.
export const ROLES = ['ADMINISTRADOR', 'DONANTE', 'BENEFICIARIO', 'USUARIO_COMUNIDAD'] as const;

export type Rol = (typeof ROLES)[number];
