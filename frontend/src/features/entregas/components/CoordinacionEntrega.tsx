import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { IlustracionEntrega } from '@shared/components/illustrations/IlustracionEntrega';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { useEntregaPorReferencia } from '../hooks/useEntregaPorReferencia.js';
import { useActualizarEntrega } from '../hooks/useActualizarEntrega.js';

// Componente específico de features/entregas (usa sus propios hooks) — se embebe en el detalle de
// Donación/Solicitud/Trueque cuando corresponde (Fase 4, sección 3: no hay POST /entregas público,
// se crea automáticamente al aceptar una oferta/propuesta).
interface CoordinacionEntregaProps {
  idReferencia: string;
  /** Sprint F5 — la contraparte de la coordinación, cuando se conoce sin ambigüedad desde la
   * página que embebe este componente (ver DonacionDetallePage: el donante no puede resolverla sin
   * una consulta adicional, por eso es opcional). Habilita el enlace directo a Mensajería, que es
   * donde se coordina el lugar de encuentro (decisión F3: Entrega no modela ubicación). */
  otroParticipanteId?: string;
}

export function CoordinacionEntrega({ idReferencia, otroParticipanteId }: CoordinacionEntregaProps): JSX.Element | null {
  const [fechaProgramada, setFechaProgramada] = useState('');
  const entrega = useEntregaPorReferencia(idReferencia);
  const actualizarEntrega = useActualizarEntrega(idReferencia);
  const { mostrarToast } = useToast();

  if (entrega.isLoading || !entrega.data) return null;

  const finalizada = entrega.data.estado === 'CONFIRMADA' || entrega.data.estado === 'CANCELADA';

  async function confirmar(): Promise<void> {
    try {
      await actualizarEntrega.mutateAsync({
        id: entrega.data!.id,
        input: { confirmar: true, fechaProgramada: fechaProgramada ? new Date(fechaProgramada).toISOString() : undefined },
      });
      mostrarToast('Entrega confirmada.', 'exito');
    } catch {
      mostrarToast('No se pudo confirmar la entrega.', 'error');
    }
  }

  return (
    <div className="coordinacion-entrega">
      <div className="coordinacion-entrega__ilustracion">
        <IlustracionEntrega />
      </div>
      <div className="coordinacion-entrega__contenido">
        <h2>Coordinación de entrega</h2>
        <p>
          Modalidad: {entrega.data.modalidad === 'RETIRO_DOMICILIO' ? 'Retiro a domicilio' : 'Entrega directa'} —{' '}
          <StatusBadge estado={entrega.data.estado} />
        </p>
        {entrega.data.fechaProgramada ? (
          <p>Programada para: {new Date(entrega.data.fechaProgramada).toLocaleString('es-EC')}</p>
        ) : null}
        {otroParticipanteId ? (
          <p>
            <Link to={`/conversaciones/${otroParticipanteId}`}>💬 Coordinar por mensaje</Link>
          </p>
        ) : null}
        {!finalizada ? (
          <>
            <label>
              Fecha y hora acordada (opcional)
              <input
                type="datetime-local"
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
              />
            </label>
            <Button type="button" onClick={confirmar} disabled={actualizarEntrega.isPending}>
              {actualizarEntrega.isPending ? 'Confirmando…' : 'Confirmar entrega'}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
