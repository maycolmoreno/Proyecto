import type { TokenPayload } from '../../modules/identidad/domain/ports/ITokenService.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

export {};
