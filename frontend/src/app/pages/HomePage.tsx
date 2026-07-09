import { useSesion } from '@features/identidad/hooks/useSesion';
import { useDashboard } from '@features/dashboard/hooks/useDashboard';
import { DashboardStatTile } from '@features/dashboard/components/DashboardStatTile';

// Fase 5, sección 2.2 — Inicio incluye Dashboard de impacto (RF-019) y publicaciones recientes (se
// conecta en Sprint F1). Login/registro/cerrar sesión ya los resuelve el Navbar del shell — esta
// página no los duplica. Sin ítem de nav propio para el dashboard (ADR-020): vive integrado aquí.
export function HomePage(): JSX.Element {
  const sesion = useSesion();
  const dashboard = useDashboard();

  if (sesion.isLoading) {
    return <p>Cargando…</p>;
  }

  if (!sesion.data) {
    return (
      <div>
        <h1>DonaConnect Ecuador</h1>
        <p>Dona, solicita e intercambia objetos con tu comunidad.</p>
      </div>
    );
  }

  // "Objetos reutilizados" (indicador ODS 12) — no es un campo propio del backend, se deriva de
  // los dos conteos que representan un objeto físico que cambió de manos.
  const objetosReutilizados = (dashboard.data?.donaciones.entregadas ?? 0) + (dashboard.data?.trueques.intercambiados ?? 0);

  return (
    <div>
      <h1>Bienvenido, {sesion.data.nombre}</h1>

      {dashboard.isLoading ? <p className="estado-lista">Cargando indicadores…</p> : null}

      {dashboard.data ? (
        <div className="grid-publicaciones">
          <DashboardStatTile icono="♻️" valor={objetosReutilizados} etiqueta="Objetos reutilizados (ODS 12)" />
          <DashboardStatTile icono="🎁" valor={dashboard.data.donaciones.publicadas} etiqueta="Donaciones publicadas" />
          <DashboardStatTile icono="🙏" valor={dashboard.data.solicitudes.atendidas} etiqueta="Solicitudes atendidas" />
          <DashboardStatTile icono="🔄" valor={dashboard.data.trueques.intercambiados} etiqueta="Trueques intercambiados" />
        </div>
      ) : null}
    </div>
  );
}
