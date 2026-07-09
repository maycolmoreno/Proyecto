import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { obtenerToken } from '@shared/lib/http-client';

// Redirige a /login si no hay sesión (Fase 5: Chatbot/Mensajes/Ubicación/Perfil/Admin exigen
// autenticado). Donaciones/Solicitudes/Trueques/Inicio quedan fuera de este wrapper — son
// públicos (Fase 5 sección 1: "Visible para Todos").
export function RutaProtegida(): JSX.Element {
  const location = useLocation();
  const autenticado = Boolean(obtenerToken());

  if (!autenticado) {
    return <Navigate to="/login" state={{ desde: location.pathname }} replace />;
  }

  return <Outlet />;
}
