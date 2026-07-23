import { NavLink } from 'react-router-dom';
import { Icon } from '@shared/components/atoms/Icon';
import type { NavItem } from '@shared/lib/nav-items';

// Componente reutilizable (ADR-045): navegación lateral fija, desktop ≥1024px (Fase 5, sección 1).
interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps): JSX.Element {
  return (
    <nav className="sidebar" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.ruta}
          to={item.ruta}
          end={item.ruta === '/'}
          className={({ isActive }) => `sidebar__item${isActive ? ' sidebar__item--activo' : ''}`}
        >
          <Icon name={item.icono} className="nav-icon" />
          <span>{item.etiqueta}</span>
        </NavLink>
      ))}
    </nav>
  );
}
