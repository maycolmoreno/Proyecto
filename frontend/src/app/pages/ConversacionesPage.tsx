import { Link, useParams } from 'react-router-dom';
import { Avatar } from '@shared/components/atoms/Avatar';
import { EstadoVacio } from '@shared/components/molecules/EstadoVacio';
import { formatearUltimaActividad } from '@shared/lib/fecha';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useConversaciones } from '@features/mensajeria/hooks/useConversaciones';
import { ConversationThread } from '@features/mensajeria/components/ConversationThread';
import type { Conversacion } from '@features/mensajeria/types/index.js';

interface ConversacionListItemProps {
  conversacion: Conversacion;
  miId: string;
  activo: boolean;
}

// Fila estilo "chat window" (ref. MDB Chat) — avatar + nombre (nunca el correo, RF-017) +
// vista previa del último mensaje + hora/fecha de esa última actividad a la derecha.
function ConversacionListItem({ conversacion, miId, activo }: ConversacionListItemProps): JSX.Element {
  const otroId = conversacion.participantes.find((p) => p !== miId) ?? conversacion.participantes[0];
  const otroUsuario = useUsuarioPublico(otroId);
  const ultimoMensaje = conversacion.mensajes[conversacion.mensajes.length - 1];
  const nombre = otroUsuario.data?.nombre ?? 'Usuario';
  const noLeidos = conversacion.mensajes.filter((m) => m.autorId !== miId && !m.leido).length;

  return (
    <Link to={`/conversaciones/${otroId}`} className={`conversacion-item${activo ? ' conversacion-item--activo' : ''}`}>
      <Avatar nombre={nombre} />
      <div className="conversacion-item__contenido">
        <div className="conversacion-item__fila-superior">
          <strong className="conversacion-item__nombre">{nombre}</strong>
          {ultimoMensaje ? (
            <span className="conversacion-item__hora">{formatearUltimaActividad(ultimoMensaje.fecha)}</span>
          ) : null}
        </div>
        {ultimoMensaje ? <p className="conversacion-item__preview">{ultimoMensaje.texto}</p> : null}
      </div>
      {noLeidos > 0 ? <span className="conversacion-item__no-leidos">{noLeidos}</span> : null}
    </Link>
  );
}

export function ConversacionesPage(): JSX.Element {
  const { id } = useParams<{ id?: string }>();
  const sesion = useSesion();
  const conversaciones = useConversaciones();

  if (sesion.isLoading || !sesion.data) return <p className="estado-lista">Cargando…</p>;

  return (
    <div>
      <h1>Mensajes</h1>
      <div className="conversaciones-layout">
        <div className="conversaciones-lista">
          {conversaciones.isLoading ? <p className="estado-lista">Cargando…</p> : null}
          {conversaciones.data && conversaciones.data.length === 0 ? (
            <EstadoVacio
              icono="💬"
              titulo="Aún no tienes conversaciones"
              descripcion="Cuando escribas a alguien desde una publicación, aparecerá aquí."
            />
          ) : null}
          {(conversaciones.data ?? []).map((c) => {
            const otroId = c.participantes.find((p) => p !== sesion.data!.id) ?? c.participantes[0];
            return <ConversacionListItem key={c.id} conversacion={c} miId={sesion.data!.id} activo={otroId === id} />;
          })}
        </div>
        <div className="conversaciones-hilo">
          {id ? (
            <ConversationThread otroParticipanteId={id} />
          ) : (
            <EstadoVacio
              className="conversaciones-hilo__vacio"
              icono="💬"
              titulo="Selecciona una conversación"
              descripcion="Elige a alguien de la lista para ver los mensajes."
            />
          )}
        </div>
      </div>
    </div>
  );
}
