import { Button } from '@shared/components/atoms/Button';
import { useNotificaciones } from '../hooks/useNotificaciones.js';
import { useMarcarLeido } from '../hooks/useMarcarLeido.js';

interface PanelNotificacionesProps {
  abierto: boolean;
  onCerrar: () => void;
}

// Organismo específico de features/notificaciones — panel desplegable bajo la campana del Navbar
// (Fase 5, sección 3). Sigue siendo montado con `abierto=false` para que TanStack Query mantenga
// el polling incluso con el panel cerrado (el contador del Navbar lo necesita).
export function PanelNotificaciones({ abierto, onCerrar }: PanelNotificacionesProps): JSX.Element | null {
  const notificaciones = useNotificaciones();
  const marcarLeido = useMarcarLeido();

  if (!abierto) return null;

  return (
    <div className="panel-notificaciones">
      <div className="panel-notificaciones__encabezado">
        <span>Notificaciones</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar notificaciones">
          ✕
        </button>
      </div>
      <div className="panel-notificaciones__lista">
        {notificaciones.isLoading ? <p className="estado-lista">Cargando…</p> : null}
        {notificaciones.data && notificaciones.data.length === 0 ? (
          <p className="estado-lista">No tienes notificaciones.</p>
        ) : null}
        {(notificaciones.data ?? []).map((n) => (
          <div
            key={n.id}
            className={`panel-notificaciones__item ${n.leido ? '' : 'panel-notificaciones__item--no-leido'}`}
          >
            <p>{n.mensaje}</p>
            <p className="panel-notificaciones__fecha">{new Date(n.fecha).toLocaleString('es-EC')}</p>
            {!n.leido ? (
              <Button type="button" variant="secundario" onClick={() => marcarLeido.mutate(n.id)} disabled={marcarLeido.isPending}>
                Marcar leída
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
