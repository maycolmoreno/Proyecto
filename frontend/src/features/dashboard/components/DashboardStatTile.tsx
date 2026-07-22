import { Link } from 'react-router-dom';

interface DashboardStatTileProps {
  icono: string;
  valor: number;
  etiqueta: string;
  /** Si viene, el tile navega al listado correspondiente en vez de ser solo un número decorativo
   * (auditoría de espacio muerto 2026-07-21). */
  to?: string;
}

// Organismo específico de features/dashboard (Fase 5, sección 2.2) — tarjeta de KPI individual.
export function DashboardStatTile({ icono, valor, etiqueta, to }: DashboardStatTileProps): JSX.Element {
  const contenido = (
    <>
      <span aria-hidden="true" className="dashboard-stat-tile__icono">
        {icono}
      </span>
      <p className="dashboard-stat-tile__valor">{valor}</p>
      <p className="dashboard-stat-tile__etiqueta">{etiqueta}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="dashboard-stat-tile dashboard-stat-tile--enlace">
        {contenido}
      </Link>
    );
  }

  return <div className="dashboard-stat-tile">{contenido}</div>;
}
