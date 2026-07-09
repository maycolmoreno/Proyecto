import { EventEmitter } from 'node:events';
import type { IEventBus, NombreEventoDominio } from '@domain/eventos/ports/IEventBus.js';
import { logger } from './logger.js';

/** Event Bus in-process (ADR-023) — Node EventEmitter, no message broker externo (Fase 6,
 * sección 5). Se agrega en Sprint 4 con el primer listener real (ModeracionIAService). */
class NodeEventBus implements IEventBus {
  private readonly emitter = new EventEmitter();

  emit<T>(nombre: NombreEventoDominio, payload: T): void {
    this.emitter.emit(nombre, payload);
  }

  on<T>(nombre: NombreEventoDominio, listener: (payload: T) => void | Promise<void>): void {
    this.emitter.on(nombre, (payload: T) => {
      Promise.resolve(listener(payload)).catch((err) =>
        logger.error({ err, evento: nombre }, 'Error en listener de evento de dominio'),
      );
    });
  }
}

export const eventBus: IEventBus = new NodeEventBus();
