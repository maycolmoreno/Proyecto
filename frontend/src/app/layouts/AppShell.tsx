import { Outlet } from 'react-router-dom';
import { Navbar } from '@shared/components/organisms/Navbar';
import { Sidebar } from '@shared/components/organisms/Sidebar';
import { BottomTabBar } from '@shared/components/organisms/BottomTabBar';
import { NAV_ITEMS, NAV_ITEMS_MOBILE, NAV_ITEMS_MAS } from '@shared/lib/nav-items';
import { useSesion, useCerrarSesion } from '@features/identidad/hooks/useSesion';
import { ChatWidget } from '@features/chatbot/components/ChatWidget';

// Layout autenticado (Fase 1, sección 9.1) — composition root del shell: es la única capa que
// conoce useSesion (BC-Identidad) y se la pasa a Navbar/Sidebar como props simples, para que esos
// sigan siendo puramente presentacionales (Fase 1 sección 9.3).
export function AppShell(): JSX.Element {
  const sesion = useSesion();
  const cerrarSesion = useCerrarSesion();

  return (
    <div className="shell">
      <Navbar usuario={sesion.data ?? null} onCerrarSesion={cerrarSesion} />
      <div className="shell__body">
        <Sidebar items={NAV_ITEMS} />
        <main className="shell__contenido">
          <Outlet />
        </main>
      </div>
      <BottomTabBar items={NAV_ITEMS_MOBILE} itemsMas={NAV_ITEMS_MAS} />
      {/* Ícono flotante visible en toda página del shell, solo con sesión activa (POST
          /chatbot/mensajes exige authMiddleware) — Fase 5, sección 3. */}
      {sesion.data ? <ChatWidget /> : null}
    </div>
  );
}
