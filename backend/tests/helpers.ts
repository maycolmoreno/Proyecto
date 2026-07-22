import { randomUUID } from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { app } from '@main/express-app.js';
import type { PerfilFuncional } from '@domain/identidad/value-objects/PerfilFuncional.js';

/** Persona de prueba — mismo nombre histórico que el `Rol` de 4 valores pre-Fase 2 (Opción D,
 * docs/DISENO_MODELO_PERFILES.md). Ya no es un valor de `rol`, se traduce a perfiles funcionales
 * abajo; se conserva el nombre porque describe mejor la intención de cada test que "perfiles". */
export type RolPrueba = 'DONANTE' | 'BENEFICIARIO' | 'USUARIO_COMUNIDAD' | 'ADMINISTRADOR';

const PERFILES_POR_PERSONA: Record<Exclude<RolPrueba, 'ADMINISTRADOR'>, PerfilFuncional[]> = {
  DONANTE: ['DONANTE', 'TRUEQUE'],
  BENEFICIARIO: ['SOLICITANTE'],
  // COMUNIDAD removido del perfil (ADR-049) — esta persona ya no se distingue de tener los 3 perfiles.
  USUARIO_COMUNIDAD: ['DONANTE', 'SOLICITANTE', 'TRUEQUE'],
};

const prisma = new PrismaClient();

export interface UsuarioDePrueba {
  id: string;
  token: string;
  correo: string;
}

/** Registra un usuario único (correo con UUID, evita colisiones entre corridas) y devuelve su token.
 * ADMINISTRADOR es caso especial: el registro público (Fase 2) ya no puede crear administradores
 * (antes sí podía — hallazgo real corregido al reducir el enum Rol), así que se siembra directo
 * por Prisma, como haría una migración/semilla real, y se inicia sesión vía HTTP normalmente. */
export async function crearUsuarioDePrueba(rol: RolPrueba): Promise<UsuarioDePrueba> {
  const correo = `vitest-${randomUUID()}@test.local`;
  const password = 'Passw0rd123';

  if (rol === 'ADMINISTRADOR') {
    await prisma.usuario.create({
      data: {
        id: randomUUID(),
        nombre: 'Admin Vitest',
        correo,
        passwordHash: await bcrypt.hash(password, 10),
        rol: 'ADMINISTRADOR',
      },
    });
  } else {
    await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'Usuario Vitest', correo, password, perfiles: PERFILES_POR_PERSONA[rol], aceptaTerminos: true })
      .expect(201);
  }

  const loginRes = await request(app).post('/api/v1/auth/login').send({ correo, password }).expect(200);

  return { id: loginRes.body.data.usuario.id, token: loginRes.body.data.token, correo };
}

/** Reutiliza la primera categoría activa ya existente (entorno local, sembrada en Sprint 1); si no
 * hay ninguna (base de datos limpia — CI, Fase 10 sección 3) crea una vía ADMINISTRADOR. POST
 * /categorias no es el objeto bajo prueba en estos flujos, solo un prerrequisito. */
export async function obtenerCategoriaId(): Promise<string> {
  const res = await request(app).get('/api/v1/categorias').expect(200);
  const existente = res.body.data.find((c: { estado: string }) => c.estado === 'ACTIVA');
  if (existente) return existente.id;

  const admin = await crearUsuarioDePrueba('ADMINISTRADOR');
  const creada = await request(app)
    .post('/api/v1/categorias')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ nombre: `Categoría Vitest ${randomUUID()}`, tipo: 'Prueba' })
    .expect(201);
  return creada.body.data.id;
}

/** Poll con timeout — usado por tests que verifican efectos de un listener asíncrono del Event Bus
 * (ej. publicaciones.test.ts: el HTTP response vuelve antes de que el listener termine de escribir
 * en Mongo). Evita tanto un `sleep` fijo (lento o flaky según la máquina) como una espera indefinida. */
export async function esperarHasta(
  condicion: () => Promise<boolean>,
  opciones: { timeoutMs?: number; intervaloMs?: number } = {},
): Promise<void> {
  const { timeoutMs = 2000, intervaloMs = 100 } = opciones;
  const limite = Date.now() + timeoutMs;
  while (Date.now() < limite) {
    if (await condicion()) return;
    await new Promise((resolve) => setTimeout(resolve, intervaloMs));
  }
  throw new Error(`esperarHasta: condición no se cumplió dentro de ${timeoutMs}ms.`);
}
