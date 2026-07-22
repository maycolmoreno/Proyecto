import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@shared/components/atoms/Button';
import { Select } from '@shared/components/atoms/Select';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { useMisDonacionesDisponibles } from '../hooks/useMisDonacionesDisponibles';
import { useCrearOferta } from '../hooks/useCrearOferta';

interface OfertarRapidoProps {
  solicitudId: string;
  categoriaId: string;
}

// Acción rápida desde el listado (SolicitudesPage) — evita entrar al detalle solo para ofertar.
// Vive en features/solicitudes/ (no en shared/), porque a diferencia de PublicacionCard sí conoce
// hooks de dominio (ADR-045: shared/ solo aloja componentes agnósticos de dominio).
export function OfertarRapido({ solicitudId, categoriaId }: OfertarRapidoProps): JSX.Element {
  const [abierto, setAbierto] = useState(false);
  const [donacionId, setDonacionId] = useState('');
  const misDonaciones = useMisDonacionesDisponibles(categoriaId);
  const crearOferta = useCrearOferta(solicitudId);
  const { mostrarToast } = useToast();
  const queryClient = useQueryClient();

  async function ofrecer(): Promise<void> {
    try {
      await crearOferta.mutateAsync({ donacionId });
      // useCrearOferta solo invalida el detalle (['solicitudes', solicitudId]) — acá además
      // invalidamos el prefijo completo para que la card de ESTE listado refleje el nuevo estado
      // sin recargar la página.
      await queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      mostrarToast('Oferta enviada — la solicitud quedó aceptada.', 'exito');
      setAbierto(false);
      setDonacionId('');
    } catch {
      mostrarToast('No se pudo enviar la oferta.', 'error');
    }
  }

  if (!abierto) {
    return (
      <Button type="button" variant="secundario" onClick={() => setAbierto(true)}>
        Ofertar
      </Button>
    );
  }

  return (
    <div className="ofertar-rapido" onClick={(e) => e.stopPropagation()}>
      {misDonaciones.isLoading ? <p className="estado-lista">Cargando tus donaciones…</p> : null}
      {!misDonaciones.isLoading && misDonaciones.data.length === 0 ? (
        <p className="ofertar-rapido__vacio">No tienes donaciones publicadas en esta categoría.</p>
      ) : null}
      {misDonaciones.data.length > 0 ? (
        <Select
          label="Elige una de tus donaciones"
          name="donacionId"
          value={donacionId}
          onChange={(e) => setDonacionId(e.target.value)}
          opciones={misDonaciones.data.map((d) => ({ valor: d.id, etiqueta: d.titulo }))}
          placeholder="Selecciona una donación"
          required
        />
      ) : null}
      <div className="ofertar-rapido__acciones">
        <Button type="button" variant="secundario" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
        <Button type="button" onClick={ofrecer} disabled={!donacionId || crearOferta.isPending}>
          {crearOferta.isPending ? 'Enviando…' : 'Confirmar oferta'}
        </Button>
      </div>
    </div>
  );
}
