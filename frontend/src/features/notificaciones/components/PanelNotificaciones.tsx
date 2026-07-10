import { Link } from 'react-router-dom';
import { Button } from '@shared/components/atoms/Button';
import { useNotificaciones } from '../hooks/useNotificaciones.js';
import { useMarcarLeido } from '../hooks/useMarcarLeido.js';
import type { Notificacion } from '../types/index.js';

interface PanelNotificacionesProps {
  abierto: boolean;
  onCerrar: () => void;
}

const RUTA_POR_ENTIDAD_TIPO: Record<string, string> = {
  DONACION: '/donaciones',
  SOLICITUD: '/solicitudes',
  TRUEQUE: '/trueques',
};

// Fallback para notificaciones creadas antes de que `entidadTipo` existiera (ver
// docs/PLAN_FRONTEND.md) — para estos `tipo` de evento el dominio es inequívoco por el nombre
// mismo, así que se puede reconstruir la ruta sin depender del campo nuevo. `PublicacionModerada`/
// `RiesgoDetectado`/`EntregaProgramada`/`EntregaConfirmada` quedan fuera a propósito: eran
// genuinamente ambiguos antes de la extensión (podían ser Donación, Solicitud o Trueque) y no hay
// forma confiable de adivinarlos retroactivamente.
const ENTIDAD_TIPO_POR_EVENTO: Record<string, string> = {
  DonacionPublicada: 'DONACION',
  OfertaRecibida: 'SOLICITUD',
  SolicitudAceptadaPorDonante: 'SOLICITUD',
  SolicitudAtendida: 'SOLICITUD',
  TruequePublicado: 'TRUEQUE',
  PropuestaTruequeRecibida: 'TRUEQUE',
  TruequeAceptadoBilateralmente: 'TRUEQUE',
  TruequeIntercambiado: 'TRUEQUE',
};

// `entidadTipo` es null para notificaciones que no llevan a ninguna publicación (ej.
// UsuarioRegistrado) o para registros anteriores a esta extensión (ver docs/PLAN_FRONTEND.md).
function rutaDe(n: Notificacion): string | null {
  if (!n.entidadRelacionada) return null;
  const entidadTipo = n.entidadTipo ?? ENTIDAD_TIPO_POR_EVENTO[n.tipo];
  if (!entidadTipo) return null;
  const base = RUTA_POR_ENTIDAD_TIPO[entidadTipo];
  return base ? `${base}/${n.entidadRelacionada}` : null;
}

// Organismo específico de features/notificaciones — panel desplegable bajo la campana del Navbar
// (Fase 5, sección 3). Sigue siendo montado con `abierto=false` para que TanStack Query mantenga
// el polling incluso con el panel cerrado (el contador del Navbar lo necesita).
export function PanelNotificaciones({ abierto, onCerrar }: PanelNotificacionesProps): JSX.Element | null {
  const notificaciones = useNotificaciones();
  const marcarLeido = useMarcarLeido();

  if (!abierto) return null;

  function alHacerClick(n: Notificacion): void {
    if (!n.leido) marcarLeido.mutate(n.id);
    onCerrar();
  }

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
        {(notificaciones.data ?? []).map((n) => {
          const ruta = rutaDe(n);
          const contenido = (
            <>
              <p>{n.mensaje}</p>
              <p className="panel-notificaciones__fecha">{new Date(n.fecha).toLocaleString('es-EC')}</p>
            </>
          );

          return (
            <div key={n.id} className={`panel-notificaciones__item ${n.leido ? '' : 'panel-notificaciones__item--no-leido'}`}>
              {ruta ? (
                <Link to={ruta} className="panel-notificaciones__link" onClick={() => alHacerClick(n)}>
                  {contenido}
                </Link>
              ) : (
                contenido
              )}
              {!n.leido ? (
                <Button type="button" variant="secundario" onClick={() => marcarLeido.mutate(n.id)} disabled={marcarLeido.isPending}>
                  Marcar leída
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
