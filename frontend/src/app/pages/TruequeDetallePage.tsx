import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { Select } from '@shared/components/atoms/Select';
import { Modal } from '@shared/components/organisms/Modal';
import { ImageUploader } from '@shared/components/molecules/ImageUploader';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useTrueque } from '@features/trueques/hooks/useTrueque';
import { useTrueques } from '@features/trueques/hooks/useTrueques';
import { useCancelarTrueque } from '@features/trueques/hooks/useCancelarTrueque';
import { useProponerTrueque } from '@features/trueques/hooks/useProponerTrueque';
import { useResponderPropuesta } from '@features/trueques/hooks/useResponderPropuesta';
import { useImagenesTrueque } from '@features/trueques/hooks/useImagenesTrueque';
import { CoordinacionEntrega } from '@features/entregas/components/CoordinacionEntrega';
import { MatchesSugeridos } from '@features/ia/components/MatchesSugeridos';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — antes ROLES_PUEDEN_PROPONER con rol.
// COMUNIDAD removido (ADR-049).
const PERFILES_PUEDEN_PROPONER: PerfilFuncional[] = ['TRUEQUE'];

export function TruequeDetallePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [truequeOfrecidoId, setTruequeOfrecidoId] = useState('');
  const sesion = useSesion();
  const trueque = useTrueque(id);
  const cancelarTrueque = useCancelarTrueque();
  const proponerTrueque = useProponerTrueque(id ?? '');
  const responderPropuesta = useResponderPropuesta(id ?? '');
  const imagenes = useImagenesTrueque(id ?? '');
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  // Mis trueques publicados — candidatos para ofrecer (RF-012: sin restricción de categoría, a
  // diferencia de las ofertas de Solicitud).
  const misTrueques = useTrueques({ estado: 'PUBLICADO', limit: 50 });

  if (trueque.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (trueque.isError || !trueque.data) return <p className="estado-lista">No se encontró este trueque.</p>;

  const esDueño = sesion.data?.id === trueque.data.usuarioId;
  const finalizado = trueque.data.estadoTrueque === 'INTERCAMBIADO' || trueque.data.estadoTrueque === 'CANCELADO';
  const misTruequesDisponibles = (misTrueques.data?.data ?? [])
    .filter((t) => t.usuarioId === sesion.data?.id)
    .filter((t) => t.id !== id);
  const miPropuestaActiva = trueque.data.propuestasRecibidas.find(
    (p) => p.usuarioProponenteId === sesion.data?.id && p.estado !== 'RECHAZADA',
  );
  const puedeProponer =
    sesion.data &&
    !esDueño &&
    PERFILES_PUEDEN_PROPONER.some((p) => sesion.data.perfiles.includes(p)) &&
    (trueque.data.estadoTrueque === 'PUBLICADO' || trueque.data.estadoTrueque === 'PROPUESTA_RECIBIDA') &&
    !miPropuestaActiva;
  // Este trueque es el "ofrecido" de una negociación (no el origen) si está en coordinación/
  // intercambiado pero ninguna de SUS propuestas recibidas está ACEPTADA — desde aquí no hay forma
  // de resolver cuál es el trueque origen (Trueque no guarda un back-reference), así que solo se
  // informa dónde revisar. Decisión documentada en docs/PLAN_FRONTEND.md (F3).
  const esLadoOfrecido =
    (trueque.data.estadoTrueque === 'EN_COORDINACION' || trueque.data.estadoTrueque === 'INTERCAMBIADO') &&
    !trueque.data.propuestasRecibidas.some((p) => p.estado === 'ACEPTADA');
  const propuestaAceptada = trueque.data.propuestasRecibidas.find((p) => p.estado === 'ACEPTADA');

  async function confirmarCancelacion(): Promise<void> {
    try {
      await cancelarTrueque.mutateAsync(id!);
      mostrarToast('Trueque cancelado.', 'exito');
      setModalCancelarAbierto(false);
      navigate('/trueques');
    } catch {
      mostrarToast('No se pudo cancelar el trueque.', 'error');
    }
  }

  async function proponer(): Promise<void> {
    try {
      await proponerTrueque.mutateAsync({ truequeOfrecidoId });
      mostrarToast('Propuesta enviada.', 'exito');
      setTruequeOfrecidoId('');
    } catch {
      mostrarToast('No se pudo enviar la propuesta.', 'error');
    }
  }

  async function aceptar(propuestaId: string): Promise<void> {
    try {
      await responderPropuesta.aceptar.mutateAsync(propuestaId);
      mostrarToast('Propuesta aceptada — se creó la coordinación de entrega.', 'exito');
    } catch {
      mostrarToast('No se pudo aceptar la propuesta.', 'error');
    }
  }

  async function rechazar(propuestaId: string): Promise<void> {
    try {
      await responderPropuesta.rechazar.mutateAsync(propuestaId);
      mostrarToast('Propuesta rechazada.', 'exito');
    } catch {
      mostrarToast('No se pudo rechazar la propuesta.', 'error');
    }
  }

  return (
    <div className="detalle-pagina">
      <div className="publicacion-card__imagen detalle-imagen-hero">
        {trueque.data.imagenes[0] ? <img src={trueque.data.imagenes[0]} alt="" /> : <span aria-hidden="true">📦</span>}
      </div>
      <StatusBadge estado={trueque.data.estadoTrueque} />
      <h1>{trueque.data.titulo}</h1>
      <p style={{ whiteSpace: 'pre-wrap' }}>{trueque.data.descripcion}</p>
      <p>Categoría: {trueque.data.categoria.nombre}</p>

      {esDueño ? (
        <>
          <ImageUploader imagenes={trueque.data.imagenes} onFirmar={imagenes.firmar} onRegistrar={imagenes.registrar} />
          {!finalizado ? (
            <Button variant="peligro" onClick={() => setModalCancelarAbierto(true)}>
              Cancelar trueque
            </Button>
          ) : null}
        </>
      ) : null}

      {puedeProponer ? (
        <div>
          <h2>Proponer intercambio</h2>
          {misTruequesDisponibles.length === 0 ? (
            <p>Publica un objeto para trueque antes de poder proponer un intercambio.</p>
          ) : (
            <>
              <Select
                label="Elige uno de tus objetos publicados"
                name="truequeOfrecidoId"
                value={truequeOfrecidoId}
                onChange={(e) => setTruequeOfrecidoId(e.target.value)}
                opciones={misTruequesDisponibles.map((t) => ({ valor: t.id, etiqueta: t.titulo }))}
                placeholder="Selecciona un objeto"
                required
              />
              <Button type="button" onClick={proponer} disabled={!truequeOfrecidoId || proponerTrueque.isPending}>
                {proponerTrueque.isPending ? 'Enviando…' : 'Proponer intercambio'}
              </Button>
            </>
          )}
        </div>
      ) : null}

      {miPropuestaActiva ? (
        <p>
          Tu propuesta está <StatusBadge estado={miPropuestaActiva.estado} />
        </p>
      ) : null}

      {esDueño && trueque.data.propuestasRecibidas.length > 0 ? (
        <div>
          <h2>Propuestas recibidas</h2>
          {trueque.data.propuestasRecibidas.map((propuesta) => (
            <div key={propuesta.id} className="oferta-item">
              <StatusBadge estado={propuesta.estado} />{' '}
              <Link to={`/trueques/${propuesta.truequeOfrecidoId}`}>Ver objeto ofrecido</Link>
              {propuesta.estado === 'PENDIENTE' ? (
                <>
                  <Button onClick={() => aceptar(propuesta.id)} disabled={responderPropuesta.aceptar.isPending}>
                    Aceptar
                  </Button>
                  <Button variant="peligro" onClick={() => rechazar(propuesta.id)} disabled={responderPropuesta.rechazar.isPending}>
                    Rechazar
                  </Button>
                </>
              ) : null}
              {propuesta.estado === 'ACEPTADA' ? (
                <Button variant="peligro" onClick={() => rechazar(propuesta.id)} disabled={responderPropuesta.rechazar.isPending}>
                  Rechazar
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!esDueño && !puedeProponer && !miPropuestaActiva && sesion.data ? (
        <p>
          <Link to={`/conversaciones/${trueque.data.usuarioId}`}>💬 Enviar mensaje al publicador</Link>
        </p>
      ) : null}

      <CoordinacionEntrega
        idReferencia={trueque.data.id}
        otroParticipanteId={esDueño ? propuestaAceptada?.usuarioProponenteId : trueque.data.usuarioId}
      />
      <MatchesSugeridos entidadTipo="TRUEQUE" entidadId={trueque.data.id} />
      {esLadoOfrecido ? (
        <p className="estado-lista">
          Este objeto fue aceptado como parte de un intercambio — revisa la coordinación de entrega desde el trueque
          con el que lo ofertaste.
        </p>
      ) : null}

      {modalCancelarAbierto ? (
        <Modal
          titulo="¿Cancelar este trueque?"
          onCerrar={() => setModalCancelarAbierto(false)}
          onConfirmar={confirmarCancelacion}
          textoConfirmar="Sí, cancelar"
          confirmando={cancelarTrueque.isPending}
        >
          <p>Esta acción no se puede deshacer.</p>
        </Modal>
      ) : null}
    </div>
  );
}
