import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { useEntregaPorReferencia } from '../hooks/useEntregaPorReferencia.js';
import { useActualizarEntrega } from '../hooks/useActualizarEntrega.js';

// Componente específico de features/entregas (usa sus propios hooks) — se embebe en el detalle de
// Donación/Solicitud/Trueque cuando corresponde (Fase 4, sección 3: no hay POST /entregas público,
// se crea automáticamente al aceptar una oferta/propuesta).
interface CoordinacionEntregaProps {
  idReferencia: string;
}

export function CoordinacionEntrega({ idReferencia }: CoordinacionEntregaProps): JSX.Element | null {
  const entrega = useEntregaPorReferencia(idReferencia);
  const actualizarEntrega = useActualizarEntrega(idReferencia);
  const { mostrarToast } = useToast();

  if (entrega.isLoading || !entrega.data) return null;

  const finalizada = entrega.data.estado === 'CONFIRMADA' || entrega.data.estado === 'CANCELADA';

  async function confirmar(): Promise<void> {
    try {
      await actualizarEntrega.mutateAsync({ id: entrega.data!.id, input: { confirmar: true } });
      mostrarToast('Entrega confirmada.', 'exito');
    } catch {
      mostrarToast('No se pudo confirmar la entrega.', 'error');
    }
  }

  return (
    <div className="coordinacion-entrega">
      <h2>Coordinación de entrega</h2>
      <p>
        Modalidad: {entrega.data.modalidad === 'RETIRO_DOMICILIO' ? 'Retiro a domicilio' : 'Entrega directa'} —{' '}
        <StatusBadge estado={entrega.data.estado} />
      </p>
      {!finalizada ? (
        <Button type="button" onClick={confirmar} disabled={actualizarEntrega.isPending}>
          {actualizarEntrega.isPending ? 'Confirmando…' : 'Confirmar entrega'}
        </Button>
      ) : null}
    </div>
  );
}
