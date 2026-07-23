import { Link } from 'react-router-dom';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useDashboard } from '@features/dashboard/hooks/useDashboard';
import { DashboardStatTile } from '@features/dashboard/components/DashboardStatTile';
import { Icon } from '@shared/components/atoms/Icon';
import { useDonaciones } from '@features/donaciones/hooks/useDonaciones';
import { DonacionCard } from '@features/donaciones/components/DonacionCard';

// Fase 5, sección 2.2 — Inicio incluye Dashboard de impacto (RF-019) y publicaciones recientes (se
// conecta en Sprint F1). Login/registro/cerrar sesión ya los resuelve el Navbar del shell — esta
// página no los duplica. Sin ítem de nav propio para el dashboard (ADR-020): vive integrado aquí.
export function HomePage(): JSX.Element {
  const sesion = useSesion();
  const dashboard = useDashboard();
  // Solo se usa en la vista de visitante (más abajo) — `enabled` evita el fetch de más cuando hay
  // sesión activa, ya que /donaciones es pública y el hook se llama antes de saber qué vista
  // renderizar (reglas de hooks: no puede llamarse condicionalmente).
  const recientes = useDonaciones({ page: 1, limit: 3, sort: 'fecha_desc' }, { enabled: !sesion.data });

  if (sesion.isLoading) {
    return <p className="estado-lista">Cargando…</p>;
  }

  if (!sesion.data) {
    return (
      <div>
        <div className="hero">
          <span className="hero__eyebrow">Comunidad · Ecuador</span>
          <h1>Dona, pide ayuda o intercambia con tu comunidad</h1>
          <p className="hero__subtitulo">
            DonaConnect conecta a quienes tienen objetos que ya no usan con quienes los necesitan — sin dinero de por medio.
          </p>
          <div className="hero__acciones">
            <Link to="/registro" className="btn btn--primario">
              Crear cuenta
            </Link>
            <Link to="/donaciones" className="btn btn--secundario">
              Explorar donaciones
            </Link>
          </div>
          <Link to="/como-funciona" className="hero__link-secundario">
            ¿Cómo funciona?
          </Link>
        </div>

        {recientes.data && recientes.data.data.length > 0 ? (
          <div className="inicio-recientes">
            <h2>Publicado recientemente</h2>
            <div className="grid-publicaciones">
              {recientes.data.data.map((donacion) => (
                <DonacionCard key={donacion.id} donacion={donacion} />
              ))}
            </div>
          </div>
        ) : null}
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
        <Link to="/publicaciones/mias" className="btn btn--secundario">
          <Icon name="file" className="nav-icon" />
          Mis publicaciones
        </Link>
      </div>

      {dashboard.isLoading ? <p className="estado-lista">Cargando indicadores…</p> : null}

      {dashboard.data ? (
        <div className="grid-publicaciones">
          <DashboardStatTile icono="♻️" valor={objetosReutilizados} etiqueta="Objetos reutilizados (ODS 12)" />
          <DashboardStatTile icono="🎁" valor={dashboard.data.donaciones.publicadas} etiqueta="Donaciones publicadas" to="/donaciones" />
          <DashboardStatTile icono="🙏" valor={dashboard.data.solicitudes.atendidas} etiqueta="Solicitudes atendidas" to="/solicitudes" />
          <DashboardStatTile icono="🔄" valor={dashboard.data.trueques.intercambiados} etiqueta="Trueques intercambiados" to="/trueques" />
          <DashboardStatTile icono="🆘" valor={dashboard.data.solicitudes.abiertas} etiqueta="Solicitudes abiertas ahora" to="/solicitudes" />
          <DashboardStatTile
            icono="🤝"
            valor={dashboard.data.usuarios.donantes + dashboard.data.usuarios.beneficiarios}
            etiqueta="Personas en la comunidad"
          />
        </div>
      ) : null}
    </div>
  );
}
