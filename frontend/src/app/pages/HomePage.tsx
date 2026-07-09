import { useSesion } from '@features/identidad/hooks/useSesion';

// Fase 5, sección 2.2 — Inicio incluye Dashboard de impacto (RF-019, se conecta en Sprint F5) y
// publicaciones recientes (se conecta en Sprint F1). Login/registro/cerrar sesión ya los resuelve
// el Navbar del shell — esta página no los duplica.
export function HomePage(): JSX.Element {
  const sesion = useSesion();

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

  return (
    <div>
      <h1>Bienvenido, {sesion.data.nombre}</h1>
      <p>Los indicadores de impacto se conectan en un sprint próximo (docs/PLAN_FRONTEND.md, F5).</p>
    </div>
  );
}
