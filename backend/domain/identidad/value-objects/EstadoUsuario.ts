export const ESTADOS_USUARIO = ['ACTIVO', 'SUSPENDIDO', 'ELIMINADO'] as const;

export type EstadoUsuario = (typeof ESTADOS_USUARIO)[number];
