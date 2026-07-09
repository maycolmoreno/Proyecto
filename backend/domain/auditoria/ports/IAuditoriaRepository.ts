export const ACCIONES_AUDITORIA = ['CREAR', 'APROBAR', 'CANCELAR', 'BLOQUEAR', 'ELIMINAR', 'LOGIN_FALLIDO'] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

export const ENTIDADES_AUDITORIA = ['USUARIO', 'DONACION', 'SOLICITUD', 'TRUEQUE', 'OFERTA', 'PROPUESTA_TRUEQUE'] as const;
export type EntidadAuditoria = (typeof ENTIDADES_AUDITORIA)[number];

export interface RegistrarAuditoriaInput {
  idUsuario: string | null;
  accion: AccionAuditoria;
  entidad: EntidadAuditoria;
  idEntidad: string;
  detalle?: Record<string, unknown> | null;
}

/** Puerto de salida (RNF-006, Fase 9 sección 3) — implementado en adapters/repositories/PrismaAuditoriaRepository.
 * Sin entidad de dominio propia: es un log de solo-append sin invariantes que proteger, no un aggregate. */
export interface IAuditoriaRepository {
  registrar(input: RegistrarAuditoriaInput): Promise<void>;
}
