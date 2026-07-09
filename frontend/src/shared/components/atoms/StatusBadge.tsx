import { grupoDeEstado } from '@shared/lib/estado-color';

// Componente reutilizable (ADR-045): color semántico + texto siempre (RNF-008/WCAG AA — el color
// nunca es el único indicador). Fase 5, sección 4.2.
interface StatusBadgeProps {
  estado: string;
  etiqueta?: string;
}

export function StatusBadge({ estado, etiqueta }: StatusBadgeProps): JSX.Element {
  const grupo = grupoDeEstado(estado);
  return <span className={`badge badge--${grupo}`}>{etiqueta ?? estado}</span>;
}
