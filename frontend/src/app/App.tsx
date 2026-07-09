import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@shared/components/organisms/ToastProvider';
import { AppShell } from './layouts/AppShell.js';
import { RutaProtegida } from './layouts/RutaProtegida.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegistroPage } from './pages/RegistroPage.js';
import { PerfilPage } from './pages/PerfilPage.js';
import { PlaceholderPage } from './pages/PlaceholderPage.js';
import { DonacionesPage } from './pages/DonacionesPage.js';
import { DonacionDetallePage } from './pages/DonacionDetallePage.js';
import { NuevaDonacionPage } from './pages/NuevaDonacionPage.js';
import { SolicitudesPage } from './pages/SolicitudesPage.js';
import { SolicitudDetallePage } from './pages/SolicitudDetallePage.js';
import { NuevaSolicitudPage } from './pages/NuevaSolicitudPage.js';

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
            <Route path="/trueques" element={<PlaceholderPage titulo="Trueque" />} />

            <Route element={<RutaProtegida />}>
              <Route path="/donaciones/nueva" element={<NuevaDonacionPage />} />
              <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
              <Route path="/chatbot" element={<PlaceholderPage titulo="Chatbot IA" />} />
              <Route path="/conversaciones" element={<PlaceholderPage titulo="Mensajes" />} />
              <Route path="/perfil" element={<PerfilPage />} />
              {/* /admin: protegido por sesión aquí; el guard de rol ADMINISTRADOR se agrega en
                  el Sprint F4 junto con el contenido real del panel (Fase 5 sección 2.7, ADR-020). */}
              <Route path="/admin" element={<PlaceholderPage titulo="Administración" />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
