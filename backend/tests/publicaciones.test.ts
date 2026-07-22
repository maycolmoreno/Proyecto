import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@main/express-app.js';
import { crearUsuarioDePrueba, obtenerCategoriaId, esperarHasta } from './helpers.js';

// Fase 5 diferida (docs/DISENO_MODELO_PERFILES.md sección 7) — proyección "Mis publicaciones".
// Primera suite que verifica efectos de un listener asíncrono del Event Bus: el HTTP response de
// publicar vuelve antes de que PublicacionIndexService termine de escribir en Mongo, así que cada
// caso hace poll con esperarHasta en vez de asumir que ya está escrito.
describe('BC-Publicaciones — proyección "Mis publicaciones"', () => {
  let categoriaId: string;

  beforeAll(async () => {
    categoriaId = await obtenerCategoriaId();
  });

  async function obtenerMisPublicaciones(token: string): Promise<{ id: string; tipo: string; estado: string }[]> {
    const res = await request(app).get('/api/v1/publicaciones/mias').set('Authorization', `Bearer ${token}`).expect(200);
    return res.body.data;
  }

  it('agrega una Donación y un Trueque publicados por el mismo usuario', async () => {
    const multiPerfil = await crearUsuarioDePrueba('USUARIO_COMUNIDAD');

    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${multiPerfil.token}`)
      .send({
        titulo: 'Donación Vitest publicaciones',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);

    const truequeRes = await request(app)
      .post('/api/v1/trueques')
      .set('Authorization', `Bearer ${multiPerfil.token}`)
      .send({ titulo: 'Trueque Vitest publicaciones', descripcion: 'Descripción', categoriaId, estadoObjeto: 'BUEN_ESTADO' })
      .expect(201);

    await esperarHasta(async () => {
      const publicaciones = await obtenerMisPublicaciones(multiPerfil.token);
      return publicaciones.some((p) => p.id === donacionRes.body.data.id) && publicaciones.some((p) => p.id === truequeRes.body.data.id);
    });

    const publicaciones = await obtenerMisPublicaciones(multiPerfil.token);
    const donacionIndexada = publicaciones.find((p) => p.id === donacionRes.body.data.id);
    const truequeIndexado = publicaciones.find((p) => p.id === truequeRes.body.data.id);
    expect(donacionIndexada?.tipo).toBe('DONACION');
    expect(truequeIndexado?.tipo).toBe('TRUEQUE');
  });

  it('aísla por dueño: las publicaciones de un usuario no aparecen en el historial de otro', async () => {
    const usuarioA = await crearUsuarioDePrueba('DONANTE');
    const usuarioB = await crearUsuarioDePrueba('DONANTE');

    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${usuarioA.token}`)
      .send({
        titulo: 'Donación Vitest solo de A',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);

    await esperarHasta(async () => {
      const publicaciones = await obtenerMisPublicaciones(usuarioA.token);
      return publicaciones.some((p) => p.id === donacionRes.body.data.id);
    });

    const publicacionesB = await obtenerMisPublicaciones(usuarioB.token);
    expect(publicacionesB.some((p) => p.id === donacionRes.body.data.id)).toBe(false);
  });

  it('una Solicitud creada aparece con estado ABIERTA (verifica el beneficiarioId nuevo en el payload)', async () => {
    const beneficiario = await crearUsuarioDePrueba('BENEFICIARIO');

    const solicitudRes = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${beneficiario.token}`)
      .send({
        titulo: 'Solicitud Vitest publicaciones',
        descripcion: 'Descripción',
        categoriaId,
        urgencia: 'MEDIA',
        ubicacion: { provincia: 'Pichincha', ciudad: 'Quito' },
      })
      .expect(201);

    await esperarHasta(async () => {
      const publicaciones = await obtenerMisPublicaciones(beneficiario.token);
      return publicaciones.some((p) => p.id === solicitudRes.body.data.id);
    });

    const publicaciones = await obtenerMisPublicaciones(beneficiario.token);
    const solicitudIndexada = publicaciones.find((p) => p.id === solicitudRes.body.data.id);
    expect(solicitudIndexada?.tipo).toBe('SOLICITUD');
    expect(solicitudIndexada?.estado).toBe('ABIERTA');
  });

  it('el estado se actualiza cuando el donante acepta una oferta (SolicitudAceptadaPorDonante)', async () => {
    const donante = await crearUsuarioDePrueba('DONANTE');
    const beneficiario = await crearUsuarioDePrueba('BENEFICIARIO');

    const donacionRes = await request(app)
      .post('/api/v1/donaciones')
      .set('Authorization', `Bearer ${donante.token}`)
      .send({
        titulo: 'Donación Vitest para oferta',
        descripcion: 'Descripción',
        categoriaId,
        estadoObjeto: 'BUEN_ESTADO',
        requiereRetiro: false,
      })
      .expect(201);

    const solicitudRes = await request(app)
      .post('/api/v1/solicitudes')
      .set('Authorization', `Bearer ${beneficiario.token}`)
      .send({
        titulo: 'Solicitud Vitest para oferta',
        descripcion: 'Descripción',
        categoriaId,
        urgencia: 'MEDIA',
        ubicacion: { provincia: 'Pichincha', ciudad: 'Quito' },
      })
      .expect(201);
    const solicitudId = solicitudRes.body.data.id;

    await request(app)
      .post(`/api/v1/solicitudes/${solicitudId}/ofertas`)
      .set('Authorization', `Bearer ${donante.token}`)
      .send({ donacionId: donacionRes.body.data.id })
      .expect(201);

    await esperarHasta(async () => {
      const publicaciones = await obtenerMisPublicaciones(beneficiario.token);
      return publicaciones.find((p) => p.id === solicitudId)?.estado === 'ACEPTADA_POR_DONANTE';
    });
  });

  it('un usuario recién registrado sin publicaciones recibe una lista vacía', async () => {
    const usuario = await crearUsuarioDePrueba('DONANTE');
    const publicaciones = await obtenerMisPublicaciones(usuario.token);
    expect(publicaciones).toEqual([]);
  });

  it('rechaza sin token con 401', async () => {
    await request(app).get('/api/v1/publicaciones/mias').expect(401);
  });
});
