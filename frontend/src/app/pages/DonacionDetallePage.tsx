import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { TextArea } from '@shared/components/atoms/TextArea';
import { Modal } from '@shared/components/organisms/Modal';
import { ImageUploader } from '@shared/components/molecules/ImageUploader';
import { GaleriaImagenes } from '@shared/components/molecules/GaleriaImagenes';
import { TarjetaAutor } from '@shared/components/molecules/TarjetaAutor';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { etiquetaEstadoObjeto } from '@shared/lib/estado-color';
import { formatearUltimaActividad } from '@shared/lib/fecha';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useDonacion } from '@features/donaciones/hooks/useDonacion';
import { useCancelarDonacion } from '@features/donaciones/hooks/useCancelarDonacion';
import { useImagenesDonacion } from '@features/donaciones/hooks/useImagenesDonacion';
import { useCrearReserva } from '@features/donaciones/hooks/useCrearReserva';
import { useResponderReserva } from '@features/donaciones/hooks/useResponderReserva';
import { useEsFavorito } from '@features/favoritos/hooks/useEsFavorito';
import { useToggleFavorito } from '@features/favoritos/hooks/useToggleFavorito';
import { CoordinacionEntrega } from '@features/entregas/components/CoordinacionEntrega';
import { MatchesSugeridos } from '@features/ia/components/MatchesSugeridos';
import { ApiError } from '@shared/lib/http-client';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Mismo criterio que Solicitudes/Trueques (Opción D, Fase 3): quién puede iniciar la acción se
// gatea por perfil funcional, no por rol.
const PERFILES_PUEDEN_RESERVAR: PerfilFuncional[] = ['SOLICITANTE'];

export function DonacionDetallePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [mensajeReserva, setMensajeReserva] = useState('');
  const sesion = useSesion();
  const donacion = useDonacion(id);
  const donante = useUsuarioPublico(donacion.data?.donanteId);
  const cancelarDonacion = useCancelarDonacion();
  const imagenes = useImagenesDonacion(id ?? '');
  const crearReserva = useCrearReserva(id ?? '');
  const responderReserva = useResponderReserva(id ?? '');
  const favorito = useEsFavorito('DONACION', donacion.data?.id);
  const toggleFavorito = useToggleFavorito();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  if (donacion.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (donacion.isError || !donacion.data) return <p className="estado-lista">No se encontró esta donación.</p>;

  const esDueño = sesion.data?.id === donacion.data.donanteId;
  const miReservaActiva = donacion.data.reservas.find(
    (r) => r.usuarioInteresadoId === sesion.data?.id && r.estado !== 'RECHAZADA',
  );
  const puedeReservar =
    sesion.data &&
    !esDueño &&
    PERFILES_PUEDEN_RESERVAR.some((p) => sesion.data.perfiles.includes(p)) &&
    donacion.data.estadoDonacion === 'PUBLICADA' &&
    !miReservaActiva;
  const reservaAceptada = donacion.data.reservas.find((r) => r.estado === 'ACEPTADA');

  async function confirmarCancelacion(): Promise<void> {
    try {
      await cancelarDonacion.mutateAsync(id!);
      mostrarToast('Donación cancelada.', 'exito');
      setModalCancelarAbierto(false);
      navigate('/donaciones');
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo cancelar la donación.';
      mostrarToast(mensaje, 'error');
    }
  }

  async function reservar(): Promise<void> {
    try {
      await crearReserva.mutateAsync({ mensaje: mensajeReserva || undefined });
      mostrarToast('Reserva enviada — el donante la revisará.', 'exito');
      setMensajeReserva('');
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo enviar la reserva.';
      mostrarToast(mensaje, 'error');
    }
  }

  async function aceptarReserva(reservaId: string): Promise<void> {
    try {
      await responderReserva.aceptar.mutateAsync(reservaId);
      mostrarToast('Reserva aceptada — se creó la coordinación de entrega.', 'exito');
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo aceptar la reserva.';
      mostrarToast(mensaje, 'error');
    }
  }

  async function rechazarReserva(reservaId: string): Promise<void> {
    try {
      await responderReserva.rechazar.mutateAsync(reservaId);
      mostrarToast('Reserva rechazada.', 'exito');
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo rechazar la reserva.';
      mostrarToast(mensaje, 'error');
    }
  }

  function alternarFavorito(): void {
    toggleFavorito.mutate({ tipoEntidad: 'DONACION', entidadId: donacion.data!.id, esFavorito: favorito });
  }

  return (
    <div className="detalle-layout">
      <div className="detalle-layout__principal detalle-pagina">
        <GaleriaImagenes imagenes={donacion.data.imagenes} />
        <div className="detalle-pagina__encabezado">
          <StatusBadge estado={donacion.data.estadoDonacion} />
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
        <h1>{donacion.data.titulo}</h1>
        <p>{donacion.data.descripcion}</p>
        {donacion.data.itemsIncluidos.length > 0 ? (
          <div className="chips">
            {donacion.data.itemsIncluidos.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="detalle-ficha lista-datos">
          <div className="lista-datos__fila">
            <dt>🏷️ Categoría</dt>
            <dd>{donacion.data.categoria.nombre}</dd>
          </div>
          <div className="lista-datos__fila">
            <dt>🔧 Condición</dt>
            <dd>{etiquetaEstadoObjeto(donacion.data.estadoObjeto)}</dd>
          </div>
          {donacion.data.ubicacionRetiro ? (
            <div className="lista-datos__fila">
              <dt>📍 Ubicación de retiro</dt>
              <dd>{donacion.data.ubicacionRetiro.ciudad}</dd>
            </div>
          ) : null}
          <div className="lista-datos__fila">
            <dt>📅 Publicado</dt>
            <dd>{formatearUltimaActividad(donacion.data.fecha)}</dd>
          </div>
        </dl>

        {esDueño ? (
          <>
            <ImageUploader imagenes={donacion.data.imagenes} onFirmar={imagenes.firmar} onRegistrar={imagenes.registrar} />
            <Button variant="peligro" onClick={() => setModalCancelarAbierto(true)}>
              Cancelar donación
            </Button>
          </>
        ) : null}

        {esDueño && donacion.data.reservas.length > 0 ? (
          <div>
            <h2>Reservas recibidas</h2>
            {donacion.data.reservas.map((reserva) => (
              <div key={reserva.id} className="oferta-item">
                <StatusBadge estado={reserva.estado} />
                {reserva.mensaje ? <p>{reserva.mensaje}</p> : null}
                {reserva.estado === 'PENDIENTE' ? (
                  <>
                    <Button onClick={() => aceptarReserva(reserva.id)} disabled={responderReserva.aceptar.isPending}>
                      Aceptar
                    </Button>
                    <Button
                      variant="peligro"
                      onClick={() => rechazarReserva(reserva.id)}
                      disabled={responderReserva.rechazar.isPending}
                    >
                      Rechazar
                    </Button>
                  </>
                ) : null}
                {reserva.estado === 'ACEPTADA' ? (
                  <Button
                    variant="peligro"
                    onClick={() => rechazarReserva(reserva.id)}
                    disabled={responderReserva.rechazar.isPending}
                  >
                    Rechazar
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* otroParticipanteId: si el compromiso vino de una reserva aceptada, el interesado es la
            contraparte válida — antes solo se resolvía el caso de Oferta vía Solicitud (undefined
            para el dueño), dejando a quien reservó sin forma de ver su propia Entrega. */}
        <CoordinacionEntrega
          idReferencia={donacion.data.id}
          otroParticipanteId={esDueño ? reservaAceptada?.usuarioInteresadoId : donacion.data.donanteId}
        />
        <MatchesSugeridos entidadTipo="DONACION" entidadId={donacion.data.id} />
      </div>

      <aside className="detalle-layout__sidebar">
        {!esDueño && donante.data ? (
          <TarjetaAutor nombre={donante.data.nombre}>
            {sesion.data ? <Link to={`/conversaciones/${donacion.data.donanteId}`}>💬 Contactar al donante</Link> : null}
          </TarjetaAutor>
        ) : null}

        {!esDueño ? (
          <div className="tarjeta tarjeta-impacto">
            <h3>Tu interés genera un gran impacto</h3>
            <p>Ayudas a familias en necesidad, reduces el desperdicio y fortaleces tu comunidad.</p>
          </div>
        ) : null}

        {miReservaActiva ? (
          <p>
            Tu reserva está <StatusBadge estado={miReservaActiva.estado} />
          </p>
        ) : null}

        {puedeReservar ? (
          <div className="tarjeta">
            <h3>¿Te interesa este artículo?</h3>
            <TextArea
              label="Mensaje para el donante (opcional)"
              name="mensajeReserva"
              value={mensajeReserva}
              onChange={(e) => setMensajeReserva(e.target.value)}
            />
            <Button type="button" onClick={reservar} disabled={crearReserva.isPending}>
              {crearReserva.isPending ? 'Enviando…' : 'Quiero este artículo'}
            </Button>
          </div>
        ) : null}
      </aside>

      {modalCancelarAbierto ? (
        <Modal
          titulo="¿Cancelar esta donación?"
          onCerrar={() => setModalCancelarAbierto(false)}
          onConfirmar={confirmarCancelacion}
          textoConfirmar="Sí, cancelar"
          confirmando={cancelarDonacion.isPending}
        >
          <p>Esta acción no se puede deshacer.</p>
        </Modal>
      ) : null}
    </div>
  );
}
