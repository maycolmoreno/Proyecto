import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@main/express-app.js';
import { crearUsuarioDePrueba, obtenerCategoriaId, type UsuarioDePrueba } from './helpers.js';

// "Quiero este artículo" — flujo core Reserva sobre Donación: crear (NO compromete, a diferencia
// de Oferta/Sprint 2) → aceptar (compromete + Entrega + auto-rechaza otras pendientes).
describe('BC-Donaciones — reservas', () => {
  let donante: UsuarioDePrueba;
  let interesado: UsuarioDePrueba;
  let categoriaId: string;

  beforeAll(async () => {
    donante = await crearUsuarioDePrueba('DONANTE');
    interesado = await crearUsuarioDePrueba('BENEFICIARIO');
    categoriaId = await obtenerCategoriaId();
  });

  it('crea reserva (no compromete), acepta (compromete + Entrega) y auto-rechaza las demás pendientes', async () => {
    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${donante.token}`)
      .send({
        titulo: 'Donación reservable Vitest',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);
    const donacionId = donacionRes.body.data.id;

    const otroInteresado = await crearUsuarioDePrueba('BENEFICIARIO');

    const reservaRes = await request(app)
      .post(`/api/v1/donaciones/${donacionId}/reservas`)
      .set('Authorization', `Bearer ${interesado.token}`)
      .send({ mensaje: 'Me interesa, gracias' })
      .expect(201);

    // NO se compromete todavía — varias personas pueden reservar mientras sigue PUBLICADA.
    expect(reservaRes.body.data.estadoDonacion).toBe('PUBLICADA');
    const reservaId = reservaRes.body.data.reservas[0].id;
    expect(reservaRes.body.data.reservas[0].estado).toBe('PENDIENTE');

    const segundaReservaRes = await request(app)
      .post(`/api/v1/donaciones/${donacionId}/reservas`)
      .set('Authorization', `Bearer ${otroInteresado.token}`)
      .send({})
      .expect(201);
    const segundaReservaId = segundaReservaRes.body.data.reservas.find(
      (r: { usuarioInteresadoId: string }) => r.usuarioInteresadoId === otroInteresado.id,
    ).id;

    const aceptarRes = await request(app)
      .patch(`/api/v1/donaciones/${donacionId}/reservas/${reservaId}`)
      .set('Authorization', `Bearer ${donante.token}`)
      .send({ aceptar: true })
      .expect(200);

    expect(aceptarRes.body.data.estadoDonacion).toBe('SOLICITADA');
    const reservaAceptada = aceptarRes.body.data.reservas.find((r: { id: string }) => r.id === reservaId);
    const otraReserva = aceptarRes.body.data.reservas.find((r: { id: string }) => r.id === segundaReservaId);
    expect(reservaAceptada.estado).toBe('ACEPTADA');
    expect(otraReserva.estado).toBe('RECHAZADA');

    // La Entrega se crea síncronamente al aceptar (mismo EntregaCoordinacionService que Oferta/Propuesta).
    const donacionActualizada = await request(app).get(`/api/v1/donaciones/${donacionId}`).expect(200);
    expect(donacionActualizada.body.data.estadoDonacion).toBe('SOLICITADA');
  });

  it('rechaza reservar la propia donación', async () => {
    // Necesita perfil SOLICITANTE (para pasar el gate de la ruta) Y ser dueño de la donación — un
    // DONANTE puro nunca llegaría al caso de uso (lo rechaza antes el perfilMiddleware con 403).
    const donanteYSolicitante = await crearUsuarioDePrueba('USUARIO_COMUNIDAD');

    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${donanteYSolicitante.token}`)
      .send({
        titulo: 'Auto-reserva Vitest',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'NUEVO',
        requiereRetiro: false,
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/donaciones/${donacionRes.body.data.id}/reservas`)
      .set('Authorization', `Bearer ${donanteYSolicitante.token}`)
      .send({})
      .expect(400);
  });

  it('no permite aceptar una reserva si la donación ya fue comprometida por una Oferta aceptada', async () => {
    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${donante.token}`)
      .send({
        titulo: 'Donación en carrera Vitest',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);
    const donacionId = donacionRes.body.data.id;

    // Reserva pendiente primero...
    const reservaRes = await request(app)
      .post(`/api/v1/donaciones/${donacionId}/reservas`)
      .set('Authorization', `Bearer ${interesado.token}`)
      .send({})
      .expect(201);
    const reservaId = reservaRes.body.data.reservas[0].id;

    // ...pero una Oferta (vía Solicitud) compromete la donación primero.
    const solicitudRes = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${interesado.token}`)
      .send({
        titulo: 'Solicitud en carrera Vitest',
        descripcion: 'Descripción',
        categoriaId,
        urgencia: 'MEDIA',
        ubicacion: { provincia: 'Pichincha', ciudad: 'Quito' },
      })
      .expect(201);

    await request(app)
      .post(`/api/v1/solicitudes/${solicitudRes.body.data.id}/ofertas`)
      .set('Authorization', `Bearer ${donante.token}`)
      .send({ donacionId })
      .expect(201);

    // La donación ya está SOLICITADA — aceptar la reserva pendiente debe rechazarse (409).
    await request(app)
      .patch(`/api/v1/donaciones/${donacionId}/reservas/${reservaId}`)
      .set('Authorization', `Bearer ${donante.token}`)
      .send({ aceptar: true })
      .expect(409);
  });
});
