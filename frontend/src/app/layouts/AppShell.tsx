import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@shared/components/organisms/Navbar';
import { Sidebar } from '@shared/components/organisms/Sidebar';
import { BottomTabBar } from '@shared/components/organisms/BottomTabBar';
import { Footer } from '@shared/components/organisms/Footer';
import { NAV_ITEMS, NAV_ITEMS_MOBILE, NAV_ITEMS_MAS } from '@shared/lib/nav-items';
import { useSesion, useCerrarSesion } from '@features/identidad/hooks/useSesion';
import { ChatWidget } from '@features/chatbot/components/ChatWidget';
import { useNotificaciones } from '@features/notificaciones/hooks/useNotificaciones';
import { PanelNotificaciones } from '@features/notificaciones/components/PanelNotificaciones';

// Layout autenticado (Fase 1, sección 9.1) — composition root del shell: es la única capa que
// conoce useSesion (BC-Identidad) y se la pasa a Navbar/Sidebar como props simples, para que esos
// sigan siendo puramente presentacionales (Fase 1 sección 9.3).
export function AppShell(): JSX.Element {
  const sesion = useSesion();
  const cerrarSesion = useCerrarSesion();
  const location = useLocation();
  const [panelAbierto, setPanelAbierto] = useState(false);
  // Habilitado solo con sesión (GET /notificaciones exige authMiddleware) — comparte queryKey con
  // PanelNotificaciones, TanStack Query deduplica la petición real.
  const notificaciones = useNotificaciones(Boolean(sesion.data));
  const contadorNoLeidas = (notificaciones.data ?? []).filter((n) => !n.leido).length;

  return (
    <div className="shell">
      <Navbar
        usuario={sesion.data ?? null}
        onCerrarSesion={cerrarSesion}
        contadorNotificaciones={contadorNoLeidas}
        onClickCampana={() => setPanelAbierto((a) => !a)}
      />
      <div className="shell__body">
        <Sidebar items={NAV_ITEMS} />
        <main className="shell__contenido">
          <Outlet />
          <Footer />
        </main>
      </div>
      <BottomTabBar items={NAV_ITEMS_MOBILE} itemsMas={NAV_ITEMS_MAS} />
      {/* Ícono flotante visible en toda página del shell, solo con sesión activa (POST
          /chatbot/mensajes exige authMiddleware) — Fase 5, sección 3. Oculto en /chatbot: esa
          página ya es el mismo asistente a pantalla completa, mostrar el widget ahí sería
          redundante (mismo useChatbot, misma conversación). */}
      {sesion.data && location.pathname !== '/chatbot' ? <ChatWidget /> : null}
      {sesion.data ? <PanelNotificaciones abierto={panelAbierto} onCerrar={() => setPanelAbierto(false)} /> : null}
    </div>
  );
}
