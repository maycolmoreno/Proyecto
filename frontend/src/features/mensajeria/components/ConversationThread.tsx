import { Fragment, useState } from 'react';
import { Button } from '@shared/components/atoms/Button';
import { Avatar } from '@shared/components/atoms/Avatar';
import { formatearHora, formatearEncabezadoDia, mismoDia } from '@shared/lib/fecha';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useConversacion } from '../hooks/useConversacion.js';
import { useEnviarMensaje } from '../hooks/useEnviarMensaje.js';

interface ConversationThreadProps {
  otroParticipanteId: string;
}

// Organismo específico de features/mensajeria (RF-017/CU-015) — hilo de mensajes con un
// participante específico. Reutiliza el mismo patrón de buffer "pendiente" que ChatWidget para
// evitar el jank del refetch de TanStack Query entre el envío y la respuesta del servidor.
export function ConversationThread({ otroParticipanteId }: ConversationThreadProps): JSX.Element {
  const [texto, setTexto] = useState('');
  const [pendiente, setPendiente] = useState<string | null>(null);
  const sesion = useSesion();
  const otroUsuario = useUsuarioPublico(otroParticipanteId);
  const conversacion = useConversacion(otroParticipanteId);
  const enviarMensaje = useEnviarMensaje(otroParticipanteId);

  async function enviar(): Promise<void> {
    const textoEnviado = texto.trim();
    if (!textoEnviado) return;
    setPendiente(textoEnviado);
    setTexto('');
    try {
      await enviarMensaje.mutateAsync(textoEnviado);
    } finally {
      setPendiente(null);
    }
  }

  const mensajes = conversacion.data?.mensajes ?? [];
  const nombreOtro = otroUsuario.data?.nombre ?? 'Conversación';
  const ahoraISO = new Date().toISOString();

  return (
    <div className="conversacion-hilo">
      <div className="conversacion-hilo__encabezado">
        <Avatar nombre={nombreOtro} />
        <div>
          <h2>{nombreOtro}</h2>
          <p>Conversación privada</p>
        </div>
      </div>
      <div className="chat-widget__mensajes chat-widget__mensajes--pagina">
        {conversacion.isLoading ? <p className="estado-lista">Cargando…</p> : null}
        {mensajes.length === 0 && !pendiente && !conversacion.isLoading ? (
          <div className="chat-widget__bienvenida">
            <span className="chat-widget__bienvenida-icono" aria-hidden="true">
              👋
            </span>
            <p className="chat-widget__bienvenida-texto">Aún no hay mensajes. Escribe el primero para iniciar la conversación con {nombreOtro}.</p>
          </div>
        ) : null}
        {mensajes.map((m, i) => {
          // Separador de día (ref. MDB Chat) — se muestra antes del primer mensaje del día y cada
          // vez que la fecha cambia respecto al mensaje anterior.
          const mensajeAnterior = mensajes[i - 1];
          const mostrarSeparador = !mensajeAnterior || !mismoDia(mensajeAnterior.fecha, m.fecha);
          return (
            <Fragment key={i}>
              {mostrarSeparador ? <p className="chat-widget__separador-dia">{formatearEncabezadoDia(m.fecha)}</p> : null}
              <div className={`chat-widget__mensaje chat-widget__mensaje--${m.autorId === sesion.data?.id ? 'usuario' : 'bot'}`}>
                <p className="chat-widget__mensaje-texto">{m.texto}</p>
                <span className="chat-widget__mensaje-hora">{formatearHora(m.fecha)}</span>
              </div>
            </Fragment>
          );
        })}
        {pendiente ? (
          <>
            {(!mensajes.length || !mismoDia(mensajes[mensajes.length - 1]!.fecha, ahoraISO)) ? (
              <p className="chat-widget__separador-dia">{formatearEncabezadoDia(ahoraISO)}</p>
            ) : null}
            <div className="chat-widget__mensaje chat-widget__mensaje--usuario">
              <p className="chat-widget__mensaje-texto">{pendiente}</p>
              <span className="chat-widget__mensaje-hora">{formatearHora(ahoraISO)}</span>
            </div>
          </>
        ) : null}
      </div>
      <div className="chat-widget__entrada">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviar()}
          placeholder="Escribe un mensaje…"
          disabled={enviarMensaje.isPending}
        />
        <Button type="button" onClick={enviar} disabled={enviarMensaje.isPending || !texto.trim()}>
          Enviar mensaje
        </Button>
      </div>
    </div>
  );
}
