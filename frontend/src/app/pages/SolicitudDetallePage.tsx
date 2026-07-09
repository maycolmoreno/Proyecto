import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { Select } from '@shared/components/atoms/Select';
import { TextArea } from '@shared/components/atoms/TextArea';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { claseUrgencia } from '@shared/lib/estado-color';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useDonaciones } from '@features/donaciones/hooks/useDonaciones';
import { useSolicitud } from '@features/solicitudes/hooks/useSolicitud';
import { useCrearOferta } from '@features/solicitudes/hooks/useCrearOferta';
import { useRechazarOferta } from '@features/solicitudes/hooks/useRechazarOferta';
import { CoordinacionEntrega } from '@features/entregas/components/CoordinacionEntrega';
import { MatchesSugeridos } from '@features/ia/components/MatchesSugeridos';

const ROLES_PUEDEN_OFERTAR = ['DONANTE', 'USUARIO_COMUNIDAD'];

export function SolicitudDetallePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [donacionId, setDonacionId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const sesion = useSesion();
  const solicitud = useSolicitud(id);
  const crearOferta = useCrearOferta(id ?? '');
  const rechazarOferta = useRechazarOferta(id ?? '');
  const { mostrarToast } = useToast();

  // Mis donaciones publicadas de la misma categoría — candidatas para ofrecer (Fase 5 sección 2.5).
  const misDonaciones = useDonaciones({
    categoriaId: solicitud.data?.categoria.id,
    estado: 'PUBLICADA',
    limit: 50,
  });

  if (solicitud.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (solicitud.isError || !solicitud.data) return <p className="estado-lista">No se encontró esta solicitud.</p>;

  const esDueño = sesion.data?.id === solicitud.data.beneficiarioId;
  const puedeOfertar =
    sesion.data &&
    !esDueño &&
    ROLES_PUEDEN_OFERTAR.includes(sesion.data.rol) &&
    solicitud.data.estadoSolicitud === 'ABIERTA';
  const misDonacionesDisponibles = (misDonaciones.data?.data ?? []).filter((d) => d.donanteId === sesion.data?.id);
  const ofertaAceptada = solicitud.data.ofertas.find((o) => o.estado === 'ACEPTADA');

  async function ofrecer(): Promise<void> {
    try {
      await crearOferta.mutateAsync({ donacionId, mensaje: mensaje || undefined });
      mostrarToast('Oferta enviada — la solicitud quedó aceptada.', 'exito');
    } catch {
      mostrarToast('No se pudo enviar la oferta.', 'error');
    }
  }

  async function rechazar(ofertaId: string): Promise<void> {
    try {
      await rechazarOferta.mutateAsync(ofertaId);
      mostrarToast('Oferta rechazada — la solicitud vuelve a estar abierta.', 'exito');
    } catch {
      mostrarToast('No se pudo rechazar la oferta.', 'error');
    }
  }

  return (
    <div>
      <StatusBadge estado={solicitud.data.estadoSolicitud} />{' '}
      <span className={claseUrgencia(solicitud.data.urgencia)}>{solicitud.data.urgencia}</span>
      <h1>{solicitud.data.titulo}</h1>
      <p>{solicitud.data.descripcion}</p>
      <p>
        Categoría: {solicitud.data.categoria.nombre} · Ciudad: {solicitud.data.ubicacion.ciudad}
      </p>
      {solicitud.data.evidenciaUrl ? (
        <p>
          <a href={solicitud.data.evidenciaUrl} target="_blank" rel="noreferrer">
            Ver evidencia
          </a>
        </p>
      ) : null}

      {puedeOfertar ? (
        <div>
          <h2>Aceptar y ofrecer</h2>
          {misDonacionesDisponibles.length === 0 ? (
            <p>No tienes donaciones publicadas en esta categoría para ofrecer.</p>
          ) : (
            <>
              <Select
                label="Elige una de tus donaciones"
                name="donacionId"
                value={donacionId}
                onChange={(e) => setDonacionId(e.target.value)}
                opciones={misDonacionesDisponibles.map((d) => ({ valor: d.id, etiqueta: d.titulo }))}
                placeholder="Selecciona una donación"
                required
              />
              <TextArea label="Mensaje (opcional)" name="mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
              <Button type="button" onClick={ofrecer} disabled={!donacionId || crearOferta.isPending}>
                {crearOferta.isPending ? 'Enviando…' : 'Aceptar y ofrecer'}
              </Button>
            </>
          )}
        </div>
      ) : null}

      {esDueño && solicitud.data.ofertas.length > 0 ? (
        <div>
          <h2>Ofertas recibidas</h2>
          {solicitud.data.ofertas.map((oferta) => (
            <div key={oferta.id} className="oferta-item">
              <StatusBadge estado={oferta.estado} />
              {oferta.mensaje ? <p>{oferta.mensaje}</p> : null}
              {oferta.estado === 'ACEPTADA' ? (
                <Button variant="peligro" onClick={() => rechazar(oferta.id)} disabled={rechazarOferta.isPending}>
                  Rechazar
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!esDueño && !puedeOfertar ? (
        // Enviar mensaje al publicador (Fase 5 sección 2.5) se conecta en el Sprint F5 (Mensajería).
        <p>💬 Enviar mensaje al publicador — disponible en un sprint próximo.</p>
      ) : null}

      {ofertaAceptada ? <CoordinacionEntrega idReferencia={ofertaAceptada.donacionId} /> : null}
      <MatchesSugeridos entidadTipo="SOLICITUD" entidadId={solicitud.data.id} />
    </div>
  );
}
