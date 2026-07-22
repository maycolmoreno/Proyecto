import { Link } from 'react-router-dom';

// Componente reutilizable (ADR-045): franja de pie del shell, agrega descubribilidad a páginas
// que a propósito no están en NAV_ITEMS (mismo criterio que el Dashboard con ADR-020: no crecer
// la navegación principal fija). Puramente presentacional, sin conocer ningún dominio.
export function Footer(): JSX.Element {
  return (
    <footer className="footer">
      <div className="footer__marca">DonaConnect Ecuador</div>
      <nav className="footer__links">
        <Link to="/como-funciona">Cómo funciona</Link>
        <Link to="/mapa">Mapa de publicaciones</Link>
      </nav>
      <p className="footer__nota">Donaciones, solicitudes de ayuda y trueque comunitario — sin dinero de por medio.</p>
    </footer>
  );
}
