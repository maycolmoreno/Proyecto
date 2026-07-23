import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@shared/components/atoms/Icon';
import type { NavItem } from '@shared/lib/nav-items';

// Componente reutilizable (ADR-045): navegación inferior, mobile <768px (Fase 5, sección 1).
// "Más" agrupa los ítems que no caben en los 5 principales (Mensajes, Perfil).
interface BottomTabBarProps {
  items: NavItem[];
  itemsMas: NavItem[];
}

export function BottomTabBar({ items, itemsMas }: BottomTabBarProps): JSX.Element {
  const [masAbierto, setMasAbierto] = useState(false);

  return (
    <>
      {masAbierto ? (
        <div className="modal-overlay" role="presentation" onClick={() => setMasAbierto(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Más opciones</h2>
            <nav aria-label="Más opciones de navegación">
              {itemsMas.map((item) => (
                <NavLink
                  key={item.ruta}
                  to={item.ruta}
                  className="sidebar__item"
                  onClick={() => setMasAbierto(false)}
                >
                  <Icon name={item.icono} className="nav-icon" />
                  <span>{item.etiqueta}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
      <nav className="bottom-tab-bar" aria-label="Navegación principal">
        {items.map((item) => (
          <NavLink
            key={item.ruta}
            to={item.ruta}
            end={item.ruta === '/'}
            className={({ isActive }) => `bottom-tab-bar__item${isActive ? ' bottom-tab-bar__item--activo' : ''}`}
          >
            <Icon name={item.icono} className="nav-icon" />
            {item.etiqueta}
          </NavLink>
        ))}
        <button
          type="button"
          className="bottom-tab-bar__item"
          onClick={() => setMasAbierto(true)}
          aria-haspopup="dialog"
        >
          <Icon name="menu" className="nav-icon" />
          Más
        </button>
      </nav>
    </>
  );
}
