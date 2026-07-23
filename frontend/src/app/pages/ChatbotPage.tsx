import { useState } from 'react';
import { Button } from '@shared/components/atoms/Button';
import { useChatbot } from '@features/chatbot/hooks/useChatbot';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { ApiError } from '@shared/lib/http-client';

// Puntos de partida para quien no sabe qué preguntar — cubren los 3 flujos principales (RF-009,
// RF-016, RF-tipo trueque) más el más frecuente en soporte (cómo coordinar la entrega).
const PREGUNTAS_SUGERIDAS = [
  '¿Cómo dono un objeto?',
  '¿Cómo pido ayuda?',
  '¿Qué es un trueque?',
  '¿Cómo coordino la entrega?',
];

export function ChatbotPage(): JSX.Element {
  const [texto, setTexto] = useState('');
  const [pendiente, setPendiente] = useState<string | null>(null);
  const chatbot = useChatbot();
  const { mostrarToast } = useToast();

  async function enviar(textoForzado?: string): Promise<void> {
    const textoEnviado = (textoForzado ?? texto).trim();
    if (!textoEnviado) return;
    setPendiente(textoEnviado);
    setTexto('');
    try {
      await chatbot.enviar(textoEnviado);
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo enviar el mensaje. Intenta de nuevo.';
      mostrarToast(mensaje, 'error');
      setTexto(textoEnviado);
    } finally {
      setPendiente(null);
    }
  }

  return (
    <div className="asistente-pagina">
      <div className="pagina-encabezado">
        <div className="pagina-encabezado__texto">
          <span className="pagina-encabezado__eyebrow">Ayuda inmediata</span>
          <h1>Asistente DonaConnect</h1>
          <p>Resuelve dudas sobre donaciones, solicitudes y trueques.</p>
        </div>
      </div>
      <section className="asistente-panel" aria-label="Conversación con el asistente">
        <div className="chat-widget__mensajes chat-widget__mensajes--pagina">
        {chatbot.cargandoHistorial ? <p className="estado-lista">Cargando…</p> : null}
        {chatbot.mensajes.length === 0 && !chatbot.cargandoHistorial && !pendiente ? (
          <div className="chat-widget__bienvenida">
            <span className="chat-widget__bienvenida-icono" aria-hidden="true">
              🤖
            </span>
            <p className="chat-widget__bienvenida-texto">
              Soy el asistente de DonaConnect. Pregúntame sobre cómo donar, pedir ayuda o hacer trueques.
            </p>
            <div className="chips">
              {PREGUNTAS_SUGERIDAS.map((pregunta) => (
                <button key={pregunta} type="button" className="chip" onClick={() => enviar(pregunta)}>
                  {pregunta}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {chatbot.mensajes.map((m, i) => (
          <p key={i} className={`chat-widget__mensaje chat-widget__mensaje--${m.rol}`}>
            {m.texto}
          </p>
        ))}
        {pendiente ? <p className="chat-widget__mensaje chat-widget__mensaje--usuario">{pendiente}</p> : null}
        {chatbot.enviando ? <p className="chat-widget__mensaje chat-widget__mensaje--bot">Escribiendo…</p> : null}
        </div>
        <div className="chat-widget__entrada">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            placeholder="Escribe tu pregunta…"
            aria-label="Mensaje para el asistente"
            disabled={chatbot.enviando}
          />
          <Button type="button" onClick={() => enviar()} disabled={chatbot.enviando || !texto.trim()}>
            Enviar
          </Button>
        </div>
      </section>
    </div>
  );
}
