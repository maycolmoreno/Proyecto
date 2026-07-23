import { Link } from 'react-router-dom';

// Rediseño de DonacionDetallePage (2026-07-23) — breadcrumb propio de esta página. "Donaciones" y
// "Categoría" enlazan al listado general: DonacionesPage guarda sus filtros en estado local (no lee
// query params de la URL), así que un deep-link a la categoría exacta exigiría modificar esa página
// (fuera de alcance — "no modificar otras páginas"). Ambos cruces igual permiten "regresar a la
// sección correspondiente" tal como pide el pedido.
interface DonationBreadcrumbProps {
  categoriaNombre: string;
  tituloPublicacion: string;
}

export function DonationBreadcrumb({ categoriaNombre, tituloPublicacion }: DonationBreadcrumbProps): JSX.Element {
  return (
    <nav className="donacion-breadcrumb" aria-label="Ruta de navegación">
      <ol className="donacion-breadcrumb__lista">
        <li>
          <Link to="/donaciones">Donaciones</Link>
        </li>
        <li aria-hidden="true" className="donacion-breadcrumb__separador">
          ›
        </li>
        <li>
          <Link to="/donaciones">{categoriaNombre}</Link>
        </li>
        <li aria-hidden="true" className="donacion-breadcrumb__separador">
          ›
        </li>
        <li className="donacion-breadcrumb__actual" aria-current="page">
          {tituloPublicacion}
        </li>
      </ol>
    </nav>
  );
}
