import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app } from '@main/express-app.js';

export type RolPrueba = 'DONANTE' | 'BENEFICIARIO' | 'USUARIO_COMUNIDAD' | 'ADMINISTRADOR';

export interface UsuarioDePrueba {
  id: string;
  token: string;
  correo: string;
}

/** Registra un usuario único (correo con UUID, evita colisiones entre corridas) y devuelve su token. */
export async function crearUsuarioDePrueba(rol: RolPrueba): Promise<UsuarioDePrueba> {
  const correo = `vitest-${randomUUID()}@test.local`;
  const password = 'Passw0rd123';

  await request(app)
    .post('/api/v1/auth/registro')
    .send({ nombre: 'Usuario Vitest', correo, password, rol, aceptaTerminos: true })
    .expect(201);

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
