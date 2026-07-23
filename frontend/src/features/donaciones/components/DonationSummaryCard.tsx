import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { etiquetaEstadoObjeto } from '@shared/lib/estado-color';
import type { Donacion } from '../types/index.js';

const LIMITE_DESCRIPCION_BREVE = 140;

// Solo capitaliza la primera letra del título — un text-transform: capitalize por CSS
// capitalizaría cada palabra y mangla siglas/nombres propios que el donante ya escribió bien.
function capitalizarPrimeraLetra(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function descripcionBreve(descripcion: string): string {
  const texto = descripcion.trim();
  if (texto.length <= LIMITE_DESCRIPCION_BREVE) return texto;
  return `${texto.slice(0, LIMITE_DESCRIPCION_BREVE).trimEnd()}…`;
}

// Rediseño de DonacionDetallePage (2026-07-23) — tarjeta principal de la columna derecha. Todos los
// campos vienen directo de `donacion` (GET /donaciones/:id, sin transformar valores de negocio).
interface DonationSummaryCardProps {
  donacion: Donacion;
  puedeGuardar: boolean;
  esFavorito: boolean;
  onAlternarFavorito: () => void;
  guardandoFavorito: boolean;
}

export function DonationSummaryCard({
  donacion,
  puedeGuardar,
  esFavorito,
  onAlternarFavorito,
  guardandoFavorito,
}: DonationSummaryCardProps): JSX.Element {
  const ubicacionTexto = donacion.ubicacionRetiro
    ? `${donacion.ubicacionRetiro.ciudad}, ${donacion.ubicacionRetiro.provincia}`
    : 'Se coordina por chat';
  const fechaPublicacion = new Date(donacion.fecha).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="tarjeta donacion-resumen">
      <div className="donacion-resumen__encabezado">
        <StatusBadge estado={donacion.estadoDonacion} />
        {puedeGuardar ? (
          <button
            type="button"
            className="donacion-resumen__guardar"
            onClick={onAlternarFavorito}
            aria-pressed={esFavorito}
            aria-label={esFavorito ? 'Quitar de guardados' : 'Guardar esta publicación'}
            disabled={guardandoFavorito}
          >
            <span aria-hidden="true">{esFavorito ? '❤️' : '🤍'}</span> {esFavorito ? 'Guardado' : 'Guardar'}
          </button>
        ) : null}
      </div>

      <h1 className="donacion-resumen__titulo">{capitalizarPrimeraLetra(donacion.titulo)}</h1>
      <p className="donacion-resumen__descripcion">{descripcionBreve(donacion.descripcion)}</p>

      {donacion.itemsIncluidos.length > 0 ? (
        <p className="donacion-resumen__cantidad">
          <span aria-hidden="true">📦</span> Incluye {donacion.itemsIncluidos.length}{' '}
          {donacion.itemsIncluidos.length === 1 ? 'artículo' : 'artículos'}: {donacion.itemsIncluidos.join(', ')}
        </p>
      ) : null}

      <dl className="donacion-resumen__ficha lista-datos">
        <div className="lista-datos__fila">
          <dt>
            <span aria-hidden="true">🏷️</span> Categoría
          </dt>
          <dd>{donacion.categoria.nombre}</dd>
        </div>
        <div className="lista-datos__fila">
          <dt>
            <span aria-hidden="true">🔧</span> Condición
          </dt>
          <dd>{etiquetaEstadoObjeto(donacion.estadoObjeto)}</dd>
        </div>
        <div className="lista-datos__fila">
          <dt>
            <span aria-hidden="true">📍</span> Ubicación de retiro
          </dt>
          <dd>{ubicacionTexto}</dd>
        </div>
        <div className="lista-datos__fila">
          <dt>
            <span aria-hidden="true">📅</span> Publicado
          </dt>
          <dd>{fechaPublicacion}</dd>
        </div>
      </dl>
    </div>
  );
}
