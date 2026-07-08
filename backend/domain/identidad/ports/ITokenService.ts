import type { Rol } from '../value-objects/Rol.js';

export interface TokenPayload {
  sub: string;
  rol: Rol;
}

/** Puerto de salida — implementado en adapters/security/JwtTokenService (ADR-032/033: HS256, 8h). */
export interface ITokenService {
  generar(payload: TokenPayload): string;
  verificar(token: string): TokenPayload;
}
