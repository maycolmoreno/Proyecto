import { useState } from 'react';
import { Button } from '@shared/components/atoms/Button';
import { useChatbot } from '../hooks/useChatbot.js';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { ApiError } from '@shared/lib/http-client';

// Organismo específico de features/chatbot (Fase 5, sección 3) — ícono flotante visible en todas
// las páginas autenticadas (embebido en AppShell). Vista completa equivalente en /chatbot
// (ChatbotPage) reutiliza el mismo hook, sin duplicar la lógica de conversación.
export function ChatWidget(): JSX.Element {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [pendiente, setPendiente] = useState<string | null>(null);
  const chatbot = useChatbot();
  const { mostrarToast } = useToast();

  async function enviar(): Promise<void> {
    const textoEnviado = texto.trim();
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
    <div className="chat-widget">
      {abierto ? (
        <div className="chat-widget__panel">
          <div className="chat-widget__encabezado">
            <span>Asistente DonaConnect</span>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar chat">
              ✕
            </button>
          </div>
          <div className="chat-widget__mensajes">
            {chatbot.cargandoHistorial ? <p className="estado-lista">Cargando…</p> : null}
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
      ) : null}
      <button type="button" className="chat-widget__boton" onClick={() => setAbierto((a) => !a)} aria-label="Abrir chat">
        💬
      </button>
    </div>
  );
}
