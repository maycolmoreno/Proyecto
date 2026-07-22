// Opción D (docs/DISENO_MODELO_PERFILES.md sección 2/6) — Value Object PerfilFuncional.
// Capacidad de marketplace, independiente de Rol (que queda solo para seguridad, Fase 2).
// COMUNIDAD removido (ADR-049) — quedará separado como agregado `Organizacion` cuando se priorice.
export const PERFILES_FUNCIONALES = ['DONANTE', 'SOLICITANTE', 'TRUEQUE'] as const;

export type PerfilFuncional = (typeof PERFILES_FUNCIONALES)[number];
