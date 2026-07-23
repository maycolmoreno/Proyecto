import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { Select } from '@shared/components/atoms/Select';
import { TextArea } from '@shared/components/atoms/TextArea';
import { TarjetaAutor } from '@shared/components/molecules/TarjetaAutor';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { claseUrgencia } from '@shared/lib/estado-color';
import { formatearUltimaActividad } from '@shared/lib/fecha';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useSolicitud } from '@features/solicitudes/hooks/useSolicitud';
import { useMisDonacionesDisponibles } from '@features/solicitudes/hooks/useMisDonacionesDisponibles';
import { useCrearOferta } from '@features/solicitudes/hooks/useCrearOferta';
import { useRechazarOferta } from '@features/solicitudes/hooks/useRechazarOferta';
import { useEsFavorito } from '@features/favoritos/hooks/useEsFavorito';
import { useToggleFavorito } from '@features/favoritos/hooks/useToggleFavorito';
import { CoordinacionEntrega } from '@features/entregas/components/CoordinacionEntrega';
import { MatchesSugeridos } from '@features/ia/components/MatchesSugeridos';
import { ApiError } from '@shared/lib/http-client';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — antes ROLES_PUEDEN_OFERTAR con rol.
// COMUNIDAD removido (ADR-049).
const PERFILES_PUEDEN_OFERTAR: PerfilFuncional[] = ['DONANTE'];

export function SolicitudDetallePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [donacionId, setDonacionId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const sesion = useSesion();
  const solicitud = useSolicitud(id);
  const beneficiario = useUsuarioPublico(solicitud.data?.beneficiarioId);
  const crearOferta = useCrearOferta(id ?? '');
  const rechazarOferta = useRechazarOferta(id ?? '');
  const favorito = useEsFavorito('SOLICITUD', solicitud.data?.id);
  const toggleFavorito = useToggleFavorito();
  const { mostrarToast } = useToast();

  // Mis donaciones publicadas de la misma categoría — candidatas para ofrecer (Fase 5 sección 2.5).
  const misDonaciones = useMisDonacionesDisponibles(solicitud.data?.categoria.id);

  if (solicitud.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (solicitud.isError || !solicitud.data) return <p className="estado-lista">No se encontró esta solicitud.</p>;

  const esDueño = sesion.data?.id === solicitud.data.beneficiarioId;
  const puedeOfertar =
    sesion.data &&
    !esDueño &&
    PERFILES_PUEDEN_OFERTAR.some((p) => sesion.data.perfiles.includes(p)) &&
    solicitud.data.estadoSolicitud === 'ABIERTA';
  const misDonacionesDisponibles = misDonaciones.data;
  const ofertaAceptada = solicitud.data.ofertas.find((o) => o.estado === 'ACEPTADA');

  async function ofrecer(): Promise<void> {
    try {
      await crearOferta.mutateAsync({ donacionId, mensaje: mensaje || undefined });
      mostrarToast('Oferta enviada — la solicitud quedó aceptada.', 'exito');
    } catch (error) {
      const mensajeError = error instanceof ApiError ? error.message : 'No se pudo enviar la oferta.';
      mostrarToast(mensajeError, 'error');
    }
  }

  async function rechazar(ofertaId: string): Promise<void> {
    try {
      await rechazarOferta.mutateAsync(ofertaId);
      mostrarToast('Oferta rechazada — la solicitud vuelve a estar abierta.', 'exito');
    } catch (error) {
      const mensajeError = error instanceof ApiError ? error.message : 'No se pudo rechazar la oferta.';
      mostrarToast(mensajeError, 'error');
    }
  }

  function alternarFavorito(): void {
    toggleFavorito.mutate({ tipoEntidad: 'SOLICITUD', entidadId: solicitud.data!.id, esFavorito: favorito });
  }

  return (
    <div className="detalle-layout">
      <div className="detalle-layout__principal detalle-pagina">
        <div className="detalle-pagina__encabezado">
          <div>
            <StatusBadge estado={solicitud.data.estadoSolicitud} />{' '}
            <span className={claseUrgencia(solicitud.data.urgencia)}>{solicitud.data.urgencia}</span>
          </div>
          {!esDueño && sesion.data ? (
            <button
              type="button"
              className="boton-favorito-detalle"
              onClick={alternarFavorito}
              aria-pressed={favorito}
              disabled={toggleFavorito.isPending}
            >
              {favorito ? '❤️ Guardado' : '🤍 Guardar'}
            </button>
          ) : null}
        </div>
        <h1>{solicitud.data.titulo}</h1>
        <p>{solicitud.data.descripcion}</p>

        <dl className="detalle-ficha lista-datos">
          <div className="lista-datos__fila">
            <dt>🏷️ Categoría</dt>
            <dd>{solicitud.data.categoria.nombre}</dd>
          </div>
          <div className="lista-datos__fila">
            <dt>📍 Ubicación</dt>
            <dd>{solicitud.data.ubicacion.ciudad}</dd>
          </div>
          <div className="lista-datos__fila">
            <dt>📅 Publicado</dt>
            <dd>{formatearUltimaActividad(solicitud.data.fecha)}</dd>
          </div>
          {solicitud.data.evidenciaUrl ? (
            <div className="lista-datos__fila">
              <dt>📎 Evidencia</dt>
              <dd>
                <a href={solicitud.data.evidenciaUrl} target="_blank" rel="noreferrer">
                  Ver enlace
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

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

        {ofertaAceptada ? (
          <CoordinacionEntrega
            idReferencia={ofertaAceptada.donacionId}
            otroParticipanteId={esDueño ? ofertaAceptada.donanteId : solicitud.data.beneficiarioId}
          />
        ) : null}
        <MatchesSugeridos entidadTipo="SOLICITUD" entidadId={solicitud.data.id} />
      </div>

      <aside className="detalle-layout__sidebar">
        {!esDueño && beneficiario.data ? (
          <TarjetaAutor nombre={beneficiario.data.nombre}>
            {!puedeOfertar && sesion.data ? (
              <Link to={`/conversaciones/${solicitud.data.beneficiarioId}`}>💬 Enviar mensaje</Link>
            ) : null}
          </TarjetaAutor>
        ) : null}

        {!esDueño ? (
          <div className="tarjeta tarjeta-impacto">
            <h3>Tu ayuda puede cambiar el día de alguien</h3>
            <p>Ofrecer lo que ya no usas resuelve una necesidad real y evita que un objeto útil se desperdicie.</p>
          </div>
        ) : null}

        {puedeOfertar ? (
          <div className="tarjeta">
            <h3>Aceptar y ofrecer</h3>
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
      </aside>
    </div>
  );
}
