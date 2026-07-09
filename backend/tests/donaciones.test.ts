import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@main/express-app.js';
import { crearUsuarioDePrueba, obtenerCategoriaId, type UsuarioDePrueba } from './helpers.js';

// Fase 6, sección 9 (RNF-009) — flujo core Donaciones: crear → listar → cancelar.
describe('BC-Donaciones — flujo core', () => {
  let donante: UsuarioDePrueba;
  let categoriaId: string;

  beforeAll(async () => {
    donante = await crearUsuarioDePrueba('DONANTE');
    categoriaId = await obtenerCategoriaId();
  });

  it('rechaza publicar sin autenticación', async () => {
    await request(app)
      .post('/api/v1/donaciones')
      .send({ titulo: 'Sin auth', descripcion: 'x', categoriaId, estadoObjeto: 'BUEN_ESTADO', requiereRetiro: false })
      .expect(401);
  });

  it('crea, lista y cancela una donación', async () => {
    const crearRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${donante.token}`)
      .send({
        titulo: 'Donación de prueba Vitest',
        descripcion: 'Descripción de prueba',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);

    const donacionId = crearRes.body.data.id;
    expect(crearRes.body.data.estadoDonacion).toBe('PUBLICADA');

    const listarRes = await request(app).get('/api/v1/donaciones').expect(200);
    expect(listarRes.body.data.some((d: { id: string }) => d.id === donacionId)).toBe(true);

    await request(app)
      .delete(`/api/v1/donaciones/${donacionId}`)
      .set('Authorization', `Bearer ${donante.token}`)
      .expect(204);

    const obtenerRes = await request(app).get(`/api/v1/donaciones/${donacionId}`).expect(200);
    expect(obtenerRes.body.data.estadoDonacion).toBe('CANCELADA');
  });
});
