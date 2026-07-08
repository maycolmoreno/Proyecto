import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../../domain/ports/ITokenService.js';

const OCHO_HORAS_EN_SEGUNDOS = 8 * 60 * 60;

/** Adaptador de salida — JWT HS256, expiración 8h sin refresh token (ADR-032/033). */
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number = OCHO_HORAS_EN_SEGUNDOS,
  ) {}

  generar(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { algorithm: 'HS256', expiresIn: this.expiresInSeconds });
  }

  verificar(token: string): TokenPayload {
    return jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as TokenPayload;
  }
}
