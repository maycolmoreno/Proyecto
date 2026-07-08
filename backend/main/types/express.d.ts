import type { TokenPayload } from '@domain/identidad/ports/ITokenService.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

export {};
