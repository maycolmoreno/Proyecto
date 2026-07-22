import { useState } from 'react';
import { Button } from '@shared/components/atoms/Button';
import { useChatbot } from '@features/chatbot/hooks/useChatbot';

export function ChatbotPage(): JSX.Element {
  const [texto, setTexto] = useState('');
  const [pendiente, setPendiente] = useState<string | null>(null);
  const chatbot = useChatbot();

  async function enviar(): Promise<void> {
    const textoEnviado = texto.trim();
    if (!textoEnviado) return;
    setPendiente(textoEnviado);
    setTexto('');
    try {
      await chatbot.enviar(textoEnviado);
    } finally {
      setPendiente(null);
    }
  }

  return (
    <div>
      <h1>Asistente DonaConnect</h1>
      <div className="chat-widget__mensajes chat-widget__mensajes--pagina">
        {chatbot.cargandoHistorial ? <p className="estado-lista">Cargando…</p> : null}
        {chatbot.mensajes.length === 0 && !chatbot.cargandoHistorial ? (
          <p className="estado-lista">Pregúntame sobre cómo donar, solicitar o hacer trueques.</p>
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
          disabled={chatbot.enviando}
        />
        <Button type="button" onClick={enviar} disabled={chatbot.enviando || !texto.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
