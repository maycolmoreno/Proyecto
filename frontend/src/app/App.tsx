import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@shared/components/organisms/ToastProvider';
import { AppShell } from './layouts/AppShell.js';
import { RutaProtegida } from './layouts/RutaProtegida.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegistroPage } from './pages/RegistroPage.js';

const PerfilPage = lazy(() => import('./pages/PerfilPage.js').then((m) => ({ default: m.PerfilPage })));
const MisPublicacionesPage = lazy(() => import('./pages/MisPublicacionesPage.js').then((m) => ({ default: m.MisPublicacionesPage })));
const DonacionesPage = lazy(() => import('./pages/DonacionesPage.js').then((m) => ({ default: m.DonacionesPage })));
const DonacionDetallePage = lazy(() => import('./pages/DonacionDetallePage.js').then((m) => ({ default: m.DonacionDetallePage })));
const NuevaDonacionPage = lazy(() => import('./pages/NuevaDonacionPage.js').then((m) => ({ default: m.NuevaDonacionPage })));
const SolicitudesPage = lazy(() => import('./pages/SolicitudesPage.js').then((m) => ({ default: m.SolicitudesPage })));
const SolicitudDetallePage = lazy(() => import('./pages/SolicitudDetallePage.js').then((m) => ({ default: m.SolicitudDetallePage })));
const NuevaSolicitudPage = lazy(() => import('./pages/NuevaSolicitudPage.js').then((m) => ({ default: m.NuevaSolicitudPage })));
const TruequesPage = lazy(() => import('./pages/TruequesPage.js').then((m) => ({ default: m.TruequesPage })));
const TruequeDetallePage = lazy(() => import('./pages/TruequeDetallePage.js').then((m) => ({ default: m.TruequeDetallePage })));
const NuevaTruequePage = lazy(() => import('./pages/NuevaTruequePage.js').then((m) => ({ default: m.NuevaTruequePage })));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage.js').then((m) => ({ default: m.ChatbotPage })));
const AdminPage = lazy(() => import('./pages/AdminPage.js').then((m) => ({ default: m.AdminPage })));
const ConversacionesPage = lazy(() => import('./pages/ConversacionesPage.js').then((m) => ({ default: m.ConversacionesPage })));
const MapaPage = lazy(() => import('./pages/MapaPage.js').then((m) => ({ default: m.MapaPage })));
const ComoFuncionaPage = lazy(() => import('./pages/ComoFuncionaPage.js').then((m) => ({ default: m.ComoFuncionaPage })));

// Routing + layout shell (Fase 1, sección 9.1). Login/Registro quedan fuera de AppShell (sin
// Navbar/Sidebar de navegación completa). Chatbot/Mensajes/Perfil/Admin exigen sesión
// (RutaProtegida); Inicio/Donaciones/Solicitudes/Trueques son públicas (Fase 5, sección 1).
export function App(): JSX.Element {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<p className="estado-lista">Cargando página…</p>}>
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
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/como-funciona" element={<ComoFuncionaPage />} />

            <Route element={<RutaProtegida />}>
              <Route path="/donaciones/nueva" element={<NuevaDonacionPage />} />
              <Route path="/solicitudes/nueva" element={<NuevaSolicitudPage />} />
              <Route path="/trueques/nuevo" element={<NuevaTruequePage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/conversaciones" element={<ConversacionesPage />} />
              <Route path="/conversaciones/:id" element={<ConversacionesPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/publicaciones/mias" element={<MisPublicacionesPage />} />
              {/* /admin: RutaProtegida solo exige sesión; el guard de rol ADMINISTRADOR vive
                  dentro de AdminPage (Fase 5 sección 2.7, ADR-020). */}
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
