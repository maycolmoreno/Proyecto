import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@shared/components/organisms/ToastProvider';
import { AppShell } from './layouts/AppShell.js';
import { RutaProtegida } from './layouts/RutaProtegida.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegistroPage } from './pages/RegistroPage.js';
import { PerfilPage } from './pages/PerfilPage.js';
import { DonacionesPage } from './pages/DonacionesPage.js';
import { DonacionDetallePage } from './pages/DonacionDetallePage.js';
import { NuevaDonacionPage } from './pages/NuevaDonacionPage.js';
import { SolicitudesPage } from './pages/SolicitudesPage.js';
import { SolicitudDetallePage } from './pages/SolicitudDetallePage.js';
import { NuevaSolicitudPage } from './pages/NuevaSolicitudPage.js';
import { TruequesPage } from './pages/TruequesPage.js';
import { TruequeDetallePage } from './pages/TruequeDetallePage.js';
import { NuevaTruequePage } from './pages/NuevaTruequePage.js';
import { ChatbotPage } from './pages/ChatbotPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { ConversacionesPage } from './pages/ConversacionesPage.js';

// Routing + layout shell (Fase 1, sección 9.1). Login/Registro quedan fuera de AppShell (sin
// Navbar/Sidebar de navegación completa). Chatbot/Mensajes/Perfil/Admin exigen sesión
// (RutaProtegida); Inicio/Donaciones/Solicitudes/Trueques son públicas (Fase 5, sección 1).
export function App(): JSX.Element {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/donaciones" element={<DonacionesPage />} />
            <Route path="/donaciones/:id" element={<DonacionDetallePage />} />
            <Route path="/solicitudes" element={<SolicitudesPage />} />
            <Route path="/solicitudes/:id" element={<SolicitudDetallePage />} />
            <Route path="/trueques" element={<TruequesPage />} />
            <Route path="/trueques/:id" element={<TruequeDetallePage />} />

            <Route element={<RutaProtegida />}>
              <Route path="/donaciones/nueva" element={<NuevaDonacionPage />} />
              <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
              <Route path="/trueques/nuevo" element={<NuevaTruequePage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/conversaciones" element={<ConversacionesPage />} />
              <Route path="/conversaciones/:id" element={<ConversacionesPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              {/* /admin: RutaProtegida solo exige sesión; el guard de rol ADMINISTRADOR vive
                  dentro de AdminPage (Fase 5 sección 2.7, ADR-020). */}
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
