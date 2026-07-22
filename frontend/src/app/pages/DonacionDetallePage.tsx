import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { Modal } from '@shared/components/organisms/Modal';
import { ImageUploader } from '@shared/components/molecules/ImageUploader';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useDonacion } from '@features/donaciones/hooks/useDonacion';
import { useCancelarDonacion } from '@features/donaciones/hooks/useCancelarDonacion';
import { useImagenesDonacion } from '@features/donaciones/hooks/useImagenesDonacion';
import { CoordinacionEntrega } from '@features/entregas/components/CoordinacionEntrega';
import { MatchesSugeridos } from '@features/ia/components/MatchesSugeridos';
import { ApiError } from '@shared/lib/http-client';

export function DonacionDetallePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const sesion = useSesion();
  const donacion = useDonacion(id);
  const cancelarDonacion = useCancelarDonacion();
  const imagenes = useImagenesDonacion(id ?? '');
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  if (donacion.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (donacion.isError || !donacion.data) return <p className="estado-lista">No se encontró esta donación.</p>;

  const esDueño = sesion.data?.id === donacion.data.donanteId;

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

  return (
    <div className="detalle-pagina">
      <div className="publicacion-card__imagen detalle-imagen-hero">
        {donacion.data.imagenes[0] ? (
          <img src={donacion.data.imagenes[0]} alt="" />
        ) : (
          <span aria-hidden="true">📦</span>
        )}
      </div>
      <StatusBadge estado={donacion.data.estadoDonacion} />
      <h1>{donacion.data.titulo}</h1>
      <p>{donacion.data.descripcion}</p>
      <p>
        Categoría: {donacion.data.categoria.nombre}
        {donacion.data.ubicacionRetiro ? ` · Ciudad: ${donacion.data.ubicacionRetiro.ciudad}` : ''}
      </p>

      {esDueño ? (
        <>
          <ImageUploader imagenes={donacion.data.imagenes} onFirmar={imagenes.firmar} onRegistrar={imagenes.registrar} />
          <Button variant="peligro" onClick={() => setModalCancelarAbierto(true)}>
            Cancelar donación
          </Button>
        </>
      ) : sesion.data ? (
        <p>
          <Link to={`/conversaciones/${donacion.data.donanteId}`}>💬 Enviar mensaje al publicador</Link>
        </p>
      ) : null}

      {/* otroParticipanteId solo se conoce desde la perspectiva de quien NO es dueño (el donante es
          siempre la contraparte válida); desde el propio donante no hay forma de resolver quién
          aceptó sin una consulta adicional — se omite el enlace de mensaje en ese caso. */}
      <CoordinacionEntrega idReferencia={donacion.data.id} otroParticipanteId={esDueño ? undefined : donacion.data.donanteId} />
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
