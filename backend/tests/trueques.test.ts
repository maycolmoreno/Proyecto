import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@main/express-app.js';
import { crearUsuarioDePrueba, obtenerCategoriaId, type UsuarioDePrueba } from './helpers.js';

// Fase 6, sección 9 (RNF-009) — flujo core Trueques: crear → proponer → aceptar bilateral (RF-013)
// → ambos trueques EN_COORDINACION + Entrega creada.
describe('BC-Trueques — flujo core', () => {
  let dueñoOrigen: UsuarioDePrueba;
  let proponente: UsuarioDePrueba;
  let categoriaId: string;

  beforeAll(async () => {
    dueñoOrigen = await crearUsuarioDePrueba('DONANTE');
    proponente = await crearUsuarioDePrueba('USUARIO_COMUNIDAD');
    categoriaId = await obtenerCategoriaId();
  });

  it('publica, propone (NO auto-acepta) y acepta bilateralmente', async () => {
    const origenRes = await request(app)
      .post('/api/v1/trueques')
      .set('Authorization', `Bearer ${dueñoOrigen.token}`)
      .send({ titulo: 'Trueque origen Vitest', descripcion: 'Descripción', categoriaId, estadoObjeto: 'BUEN_ESTADO' })
      .expect(201);
    const origenId = origenRes.body.data.id;

    const ofrecidoRes = await request(app)
      .post('/api/v1/trueques')
      .set('Authorization', `Bearer ${proponente.token}`)
      .send({ titulo: 'Trueque ofrecido Vitest', descripcion: 'Descripción', categoriaId, estadoObjeto: 'BUEN_ESTADO' })
      .expect(201);
    const ofrecidoId = ofrecidoRes.body.data.id;

    const proponerRes = await request(app)
      .post(`/api/v1/trueques/${origenId}/propuestas`)
      .set('Authorization', `Bearer ${proponente.token}`)
      .send({ truequeOfrecidoId: ofrecidoId })
      .expect(201);

    // NO se auto-acepta (a diferencia de Solicitudes): sigue PROPUESTA_RECIBIDA/PENDIENTE.
    expect(proponerRes.body.data.estadoTrueque).toBe('PROPUESTA_RECIBIDA');
    const propuestaId = proponerRes.body.data.propuestasRecibidas[0].id;
    expect(proponerRes.body.data.propuestasRecibidas[0].estado).toBe('PENDIENTE');

    const aceptarRes = await request(app)
      .patch(`/api/v1/trueques/${origenId}/propuestas/${propuestaId}`)
      .set('Authorization', `Bearer ${dueñoOrigen.token}`)
      .send({ aceptar: true })
      .expect(200);

    expect(aceptarRes.body.data.estadoTrueque).toBe('EN_COORDINACION');

    const ofrecidoActualizado = await request(app).get(`/api/v1/trueques/${ofrecidoId}`).expect(200);
    expect(ofrecidoActualizado.body.data.estadoTrueque).toBe('EN_COORDINACION');
  });

  it('rechaza proponer sobre el propio trueque', async () => {
    const origenRes = await request(app)
      .post('/api/v1/trueques')
      .set('Authorization', `Bearer ${dueñoOrigen.token}`)
      .send({ titulo: 'Auto-trueque Vitest', descripcion: 'Descripción', categoriaId, estadoObjeto: 'NUEVO' })
      .expect(201);

    const ofrecidoRes = await request(app)
      .post('/api/v1/trueques')
      .set('Authorization', `Bearer ${dueñoOrigen.token}`)
      .send({ titulo: 'Auto-trueque ofrecido Vitest', descripcion: 'Descripción', categoriaId, estadoObjeto: 'NUEVO' })
      .expect(201);

    await request(app)
      .post(`/api/v1/trueques/${origenRes.body.data.id}/propuestas`)
      .set('Authorization', `Bearer ${dueñoOrigen.token}`)
      .send({ truequeOfrecidoId: ofrecidoRes.body.data.id })
      .expect(400);
  });
});
