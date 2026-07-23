import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { Modal } from '@shared/components/organisms/Modal';
import { useToast } from '@shared/components/organisms/ToastProvider';
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
import { DonationBreadcrumb } from '@features/donaciones/components/DonationBreadcrumb';
import { DonationGallery } from '@features/donaciones/components/DonationGallery';
import { DonationSummaryCard } from '@features/donaciones/components/DonationSummaryCard';
import { DonationActions } from '@features/donaciones/components/DonationActions';
import { DonationDescription } from '@features/donaciones/components/DonationDescription';
import { DonationAttributes } from '@features/donaciones/components/DonationAttributes';
import { DeliveryDetails } from '@features/donaciones/components/DeliveryDetails';
import { DonationLocation } from '@features/donaciones/components/DonationLocation';
import { DonorCard } from '@features/donaciones/components/DonorCard';
import { SafetyTips } from '@features/donaciones/components/SafetyTips';
import { ApiError } from '@shared/lib/http-client';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Mismo criterio que Solicitudes/Trueques (Opción D, Fase 3): quién puede iniciar la acción se
// gatea por perfil funcional, no por rol.
const PERFILES_PUEDEN_RESERVAR: PerfilFuncional[] = ['SOLICITANTE'];

// Rediseño visual (2026-07-23, pedido del usuario) — ficha tipo marketplace. Toda la lógica de
// negocio (hooks, handlers, condiciones de permiso) es la MISMA que la versión anterior de este
// archivo; solo cambia cómo se compone el JSX (delegado a los componentes de
// features/donaciones/components/Donation*). Ver esos archivos para el detalle de qué se omitió
// del mockup de referencia por no tener respaldo real en el backend (edición, pausar/reactivar,
// atributos inexistentes, datos del donante no expuestos, etc.).
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

  if (donacion.isLoading) {
    return (
      <div className="donacion-detalle-pagina">
        <div className="donacion-skeleton">
          <div className="donacion-skeleton__galeria skeleton" />
          <div className="donacion-skeleton__info">
            <div className="skeleton donacion-skeleton__linea donacion-skeleton__linea--corta" />
            <div className="skeleton donacion-skeleton__linea" />
            <div className="skeleton donacion-skeleton__linea" />
            <div className="skeleton donacion-skeleton__linea donacion-skeleton__linea--corta" />
          </div>
        </div>
      </div>
    );
  }

  if (donacion.isError || !donacion.data) {
    return (
      <div className="estado-lista">
        <p>No se pudo cargar esta donación.</p>
        <Button type="button" variant="secundario" onClick={() => donacion.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

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
  const puedeGuardar = !esDueño && Boolean(sesion.data);

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
    <div className="donacion-detalle-pagina">
      <DonationBreadcrumb categoriaNombre={donacion.data.categoria.nombre} tituloPublicacion={donacion.data.titulo} />

      <div className="donacion-detalle-grid">
        <DonationGallery
          imagenes={donacion.data.imagenes}
          titulo={donacion.data.titulo}
          estadoBadge={<StatusBadge estado={donacion.data.estadoDonacion} />}
        />

        <div className="donacion-detalle-grid__info">
          <DonationSummaryCard
            donacion={donacion.data}
            puedeGuardar={puedeGuardar}
            esFavorito={favorito}
            onAlternarFavorito={alternarFavorito}
            guardandoFavorito={toggleFavorito.isPending}
          />

          <DonationActions
            donacion={donacion.data}
            esDueño={esDueño}
            haySesion={Boolean(sesion.data)}
            puedeReservar={Boolean(puedeReservar)}
            miReservaActiva={miReservaActiva}
            mensajeReserva={mensajeReserva}
            onMensajeReservaChange={setMensajeReserva}
            onReservar={reservar}
            reservando={crearReserva.isPending}
            onAceptarReserva={aceptarReserva}
            onRechazarReserva={rechazarReserva}
            aceptandoReserva={responderReserva.aceptar.isPending}
            rechazandoReserva={responderReserva.rechazar.isPending}
            onAbrirCancelar={() => setModalCancelarAbierto(true)}
            onFirmarImagen={imagenes.firmar}
            onRegistrarImagen={imagenes.registrar}
          />
        </div>
      </div>

      {/* otroParticipanteId: si el compromiso vino de una reserva aceptada, el interesado es la
          contraparte válida — antes solo se resolvía el caso de Oferta vía Solicitud (undefined
          para el dueño), dejando a quien reservó sin forma de ver su propia Entrega. */}
      <CoordinacionEntrega
        idReferencia={donacion.data.id}
        otroParticipanteId={esDueño ? reservaAceptada?.usuarioInteresadoId : donacion.data.donanteId}
      />

      <div className="donacion-detalle-secciones">
        <div className="donacion-detalle-secciones__columna">
          <DonationDescription descripcion={donacion.data.descripcion} />
          <DonationAttributes itemsIncluidos={donacion.data.itemsIncluidos} />
        </div>
        <div className="donacion-detalle-secciones__columna">
          <DeliveryDetails requiereRetiro={donacion.data.requiereRetiro} ubicacionRetiro={donacion.data.ubicacionRetiro} />
          <DonationLocation ubicacionRetiro={donacion.data.ubicacionRetiro} />
        </div>
        <div className="donacion-detalle-secciones__columna">
          <DonorCard esDueño={esDueño} nombreDonante={donante.data?.nombre} donanteId={donacion.data.donanteId} haySesion={Boolean(sesion.data)} />
          <SafetyTips />
        </div>
      </div>

      <MatchesSugeridos entidadTipo="DONACION" entidadId={donacion.data.id} />

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
