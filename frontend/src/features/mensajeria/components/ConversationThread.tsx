import { useState } from 'react';
import { Button } from '@shared/components/atoms/Button';
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

  return (
    <div>
      <h2>{otroUsuario.data?.nombre ?? 'Conversación'}</h2>
      <div className="chat-widget__mensajes chat-widget__mensajes--pagina">
        {conversacion.isLoading ? <p className="estado-lista">Cargando…</p> : null}
        {mensajes.length === 0 && !pendiente ? <p className="estado-lista">Aún no hay mensajes — escribe el primero.</p> : null}
        {mensajes.map((m, i) => (
          <p
            key={i}
            className={`chat-widget__mensaje chat-widget__mensaje--${m.autorId === sesion.data?.id ? 'usuario' : 'bot'}`}
          >
            {m.texto}
          </p>
        ))}
        {pendiente ? <p className="chat-widget__mensaje chat-widget__mensaje--usuario">{pendiente}</p> : null}
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
          Enviar
        </Button>
      </div>
    </div>
  );
}
