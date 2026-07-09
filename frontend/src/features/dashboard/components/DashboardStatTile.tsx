interface DashboardStatTileProps {
  icono: string;
  valor: number;
  etiqueta: string;
}

// Organismo específico de features/dashboard (Fase 5, sección 2.2) — tarjeta de KPI individual.
export function DashboardStatTile({ icono, valor, etiqueta }: DashboardStatTileProps): JSX.Element {
  return (
    <div className="dashboard-stat-tile">
      <span aria-hidden="true" className="dashboard-stat-tile__icono">
        {icono}
      </span>
      <p className="dashboard-stat-tile__valor">{valor}</p>
      <p className="dashboard-stat-tile__etiqueta">{etiqueta}</p>
    </div>
  );
}
