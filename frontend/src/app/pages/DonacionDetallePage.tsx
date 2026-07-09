import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    } catch {
      mostrarToast('No se pudo cancelar la donación.', 'error');
    }
  }

  return (
    <div>
      <div className="publicacion-card__imagen" style={{ aspectRatio: '16/9', maxWidth: 480 }}>
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
      ) : (
        // Enviar mensaje al publicador (Fase 5 sección 2.5) se conecta en el Sprint F5 (Mensajería).
        <p>💬 Enviar mensaje al publicador — disponible en un sprint próximo.</p>
      )}

      <CoordinacionEntrega idReferencia={donacion.data.id} />
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
