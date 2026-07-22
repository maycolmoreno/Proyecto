import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@main/express-app.js';
import { obtenerCategoriaId } from './helpers.js';

// Opción D (docs/DISENO_MODELO_PERFILES.md, Fase 4) — cobertura de perfilMiddleware: un usuario
// con un perfil insuficiente debe recibir 403, y PATCH /usuarios/me/perfiles debe cambiar
// efectivamente lo que puede hacer en el siguiente request (perfiles embebidos en el JWT, se
// necesita re-login para reflejar el cambio — igual que rol antes).
async function registrarConPerfiles(perfiles: string[]): Promise<{ token: string; correo: string }> {
  const correo = `vitest-perfiles-${randomUUID()}@test.local`;
  const password = 'Passw0rd123';

  await request(app)
    .post('/api/v1/auth/registro')
    .send({ nombre: 'Usuario Perfiles Vitest', correo, password, perfiles, aceptaTerminos: true })
    .expect(201);

  const loginRes = await request(app).post('/api/v1/auth/login').send({ correo, password }).expect(200);
  return { token: loginRes.body.data.token, correo };
}

describe('Opción D — perfiles funcionales', () => {
  let categoriaId: string;

  beforeAll(async () => {
    categoriaId = await obtenerCategoriaId();
  });

  it('rechaza el contrato viejo de registro (rol) con 400 de validación', async () => {
    await request(app)
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'X',
        correo: `vitest-rol-viejo-${randomUUID()}@test.local`,
        password: 'Passw0rd123',
        rol: 'ADMINISTRADOR',
        aceptaTerminos: true,
      })
      .expect(400);
  });

  it('un usuario con solo perfil SOLICITANTE no puede publicar una Donación (403)', async () => {
    const solicitante = await registrarConPerfiles(['SOLICITANTE']);

    await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${solicitante.token}`)
      .send({ titulo: 'No debería crearse', descripcion: 'x', categoriaId, estadoObjeto: 'BUEN_ESTADO', requiereRetiro: false })
      .expect(403);
  });

  it('un usuario con solo perfil DONANTE no puede crear una Solicitud (403)', async () => {
    const donante = await registrarConPerfiles(['DONANTE']);

    await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${donante.token}`)
      .send({
        titulo: 'No debería crearse',
        descripcion: 'x',
        categoriaId,
        urgencia: 'MEDIA',
        ubicacion: { provincia: 'Pichincha', ciudad: 'Quito' },
      })
      .expect(403);
  });

  it('PATCH /usuarios/me/perfiles agrega DONANTE y el siguiente login ya puede publicar', async () => {
    const solicitante = await registrarConPerfiles(['SOLICITANTE']);

    await request(app)
      .patch('/api/v1/usuarios/me/perfiles')
      .set('Authorization', `Bearer ${solicitante.token}`)
      .send({ perfiles: ['SOLICITANTE', 'DONANTE'] })
      .expect(200);

    const nuevoLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ correo: solicitante.correo, password: 'Passw0rd123' })
      .expect(200);

    await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${nuevoLogin.body.data.token}`)
      .send({ titulo: 'Ahora sí se crea', descripcion: 'x', categoriaId, estadoObjeto: 'BUEN_ESTADO', requiereRetiro: false })
      .expect(201);
  });

  it('GET /usuarios/me refleja los perfiles asignados en el registro', async () => {
    const usuario = await registrarConPerfiles(['TRUEQUE', 'DONANTE']);

    const meRes = await request(app).get('/api/v1/usuarios/me').set('Authorization', `Bearer ${usuario.token}`).expect(200);

    expect(meRes.body.data.perfiles.sort()).toEqual(['DONANTE', 'TRUEQUE']);
    expect(meRes.body.data.rol).toBe('USUARIO');
  });

  it('rechaza COMUNIDAD como perfil — fue removido del modelo (ADR-049)', async () => {
    const correo = `vitest-perfiles-${randomUUID()}@test.local`;
    await request(app)
      .post('/api/v1/auth/registro')
      .send({ nombre: 'X', correo, password: 'Passw0rd123', perfiles: ['COMUNIDAD'], aceptaTerminos: true })
      .expect(400);
  });
});
