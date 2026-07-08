import pino from 'pino';
import { env } from './env.js';

// ADR-037 — Pino, logging estructurado a stdout.
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
});
