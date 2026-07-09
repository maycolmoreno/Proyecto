import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@main/express-app.js';
import { crearUsuarioDePrueba, obtenerCategoriaId, type UsuarioDePrueba } from './helpers.js';

// Fase 6, sección 9 (RNF-009) — flujo core Solicitudes: crear → ofertar → aceptar (un solo paso,
// Fase 4) → Entrega creada automáticamente.
describe('BC-Solicitudes — flujo core', () => {
  let donante: UsuarioDePrueba;
  let beneficiario: UsuarioDePrueba;
  let categoriaId: string;

  beforeAll(async () => {
    donante = await crearUsuarioDePrueba('DONANTE');
    beneficiario = await crearUsuarioDePrueba('BENEFICIARIO');
    categoriaId = await obtenerCategoriaId();
  });

  it('crea solicitud, recibe oferta que la acepta en un paso y genera Entrega', async () => {
    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${donante.token}`)
      .send({
        titulo: 'Donación para solicitud Vitest',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);
    const donacionId = donacionRes.body.data.id;

    const solicitudRes = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${beneficiario.token}`)
      .send({
        titulo: 'Solicitud de prueba Vitest',
        descripcion: 'Descripción',
        categoriaId,
        urgencia: 'MEDIA',
        ubicacion: { provincia: 'Pichincha', ciudad: 'Quito' },
      })
      .expect(201);
    const solicitudId = solicitudRes.body.data.id;
    expect(solicitudRes.body.data.estadoSolicitud).toBe('ABIERTA');

    const ofertaRes = await request(app)
      .post(`/api/v1/solicitudes/${solicitudId}/ofertas`)
      .set('Authorization', `Bearer ${donante.token}`)
      .send({ donacionId })
      .expect(201);

    expect(ofertaRes.body.data.estadoSolicitud).toBe('ACEPTADA_POR_DONANTE');
    expect(ofertaRes.body.data.ofertas[0].estado).toBe('ACEPTADA');

    // La Entrega se crea síncronamente al aceptar (EntregaCoordinacionService, Fase 6 sección 3).
    const entregasRes = await request(app).get(`/api/v1/donaciones/${donacionId}`).expect(200);
    expect(entregasRes.body.data.estadoDonacion).toBe('PUBLICADA');
  });

  it('rechaza ofertar sobre la propia solicitud', async () => {
    // USUARIO_COMUNIDAD puede tanto crear solicitudes (beneficiarioOComunidad) como ofertar
    // (donanteOComunidad, Fase 4) — es el único rol que puede protagonizar ambos lados del intento
    // de auto-transacción en esta prueba.
    const comunidad = await crearUsuarioDePrueba('USUARIO_COMUNIDAD');

    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${comunidad.token}`)
      .send({
        titulo: 'Donación auto-oferta Vitest',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);

    const solicitudRes = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${comunidad.token}`)
      .send({
        titulo: 'Solicitud propia Vitest',
        descripcion: 'Descripción',
        categoriaId,
        urgencia: 'BAJA',
        ubicacion: { provincia: 'Pichincha', ciudad: 'Quito' },
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/solicitudes/${solicitudRes.body.data.id}/ofertas`)
      .set('Authorization', `Bearer ${comunidad.token}`)
      .send({ donacionId: donacionRes.body.data.id })
      .expect(400);
  });
});
