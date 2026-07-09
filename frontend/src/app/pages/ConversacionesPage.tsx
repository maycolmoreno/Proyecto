import { Link, useParams } from 'react-router-dom';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useConversaciones } from '@features/mensajeria/hooks/useConversaciones';
import { ConversationThread } from '@features/mensajeria/components/ConversationThread';
import type { Conversacion } from '@features/mensajeria/types/index.js';

function ConversacionListItem({ conversacion, miId }: { conversacion: Conversacion; miId: string }): JSX.Element {
  const otroId = conversacion.participantes.find((p) => p !== miId) ?? conversacion.participantes[0];
  const otroUsuario = useUsuarioPublico(otroId);
  const ultimoMensaje = conversacion.mensajes[conversacion.mensajes.length - 1];

  return (
    <Link to={`/conversaciones/${otroId}`} className="oferta-item">
      <p>
        <strong>{otroUsuario.data?.nombre ?? 'Usuario'}</strong>
      </p>
      {ultimoMensaje ? <p>{ultimoMensaje.texto}</p> : null}
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
            <p className="estado-lista">Aún no tienes conversaciones.</p>
          ) : null}
          {(conversaciones.data ?? []).map((c) => (
            <ConversacionListItem key={c.id} conversacion={c} miId={sesion.data!.id} />
          ))}
        </div>
        <div className="conversaciones-hilo">
          {id ? <ConversationThread otroParticipanteId={id} /> : <p className="estado-lista">Selecciona una conversación.</p>}
        </div>
      </div>
    </div>
  );
}
