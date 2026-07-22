import { Link } from 'react-router-dom';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useDashboard } from '@features/dashboard/hooks/useDashboard';
import { DashboardStatTile } from '@features/dashboard/components/DashboardStatTile';
import { Button } from '@shared/components/atoms/Button';

// Fase 5, sección 2.2 — Inicio incluye Dashboard de impacto (RF-019) y publicaciones recientes (se
// conecta en Sprint F1). Login/registro/cerrar sesión ya los resuelve el Navbar del shell — esta
// página no los duplica. Sin ítem de nav propio para el dashboard (ADR-020): vive integrado aquí.
export function HomePage(): JSX.Element {
  const sesion = useSesion();
  const dashboard = useDashboard();

  if (sesion.isLoading) {
    return <p className="estado-lista">Cargando…</p>;
  }

  if (!sesion.data) {
    return (
      <div className="hero">
        <span className="hero__eyebrow">Comunidad · Ecuador</span>
        <h1>Dona, pide ayuda o intercambia con tu comunidad</h1>
        <p className="hero__subtitulo">
          DonaConnect conecta a quienes tienen objetos que ya no usan con quienes los necesitan — sin dinero de por medio.
        </p>
        <div className="hero__acciones">
          <Link to="/registro">
            <Button type="button">Crear cuenta</Button>
          </Link>
          <Link to="/donaciones">
            <Button type="button" variant="secundario">
              Explorar donaciones
            </Button>
          </Link>
        </div>
        <Link to="/como-funciona" className="hero__link-secundario">
          ¿Cómo funciona?
        </Link>
      </div>
    );
  }

  // "Objetos reutilizados" (indicador ODS 12) — no es un campo propio del backend, se deriva de
  // los dos conteos que representan un objeto físico que cambió de manos.
  const objetosReutilizados = (dashboard.data?.donaciones.entregadas ?? 0) + (dashboard.data?.trueques.intercambiados ?? 0);

  return (
    <div>
      <div className="inicio-saludo">
        <div>
          <h1>Bienvenido, {sesion.data.nombre}</h1>
          <p className="inicio-saludo__subtitulo">Este es el impacto que la comunidad ha generado hasta hoy.</p>
        </div>
        <Link to="/publicaciones/mias">
          <Button type="button" variant="secundario">
            📜 Mis publicaciones
          </Button>
        </Link>
      </div>

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
