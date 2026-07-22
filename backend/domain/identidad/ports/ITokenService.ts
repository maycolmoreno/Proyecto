import type { Rol } from '../value-objects/Rol.js';
import type { PerfilFuncional } from '../value-objects/PerfilFuncional.js';

export interface TokenPayload {
  sub: string;
  rol: Rol;
  /** Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md) — capacidad de marketplace, embebida en el
   * token igual que rol (evita una consulta a usuarios_perfiles en cada request). Se recalcula en
   * cada login; cambios vía PATCH /usuarios/me/perfiles solo aplican al siguiente token emitido. */
  perfiles: PerfilFuncional[];
}

/** Puerto de salida — implementado en adapters/security/JwtTokenService (ADR-032/033: HS256, 8h). */
export interface ITokenService {
  generar(payload: TokenPayload): string;
  verificar(token: string): TokenPayload;
}
