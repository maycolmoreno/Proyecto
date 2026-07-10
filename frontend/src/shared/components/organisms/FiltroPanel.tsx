import type { OpcionSelect } from '@shared/components/atoms/Select';

// Componente reutilizable (ADR-045): filtros de listado, configurable por dominio vía props
// (Fase 4, sección 8) — no sabe qué filtros son "de Donación" vs "de Solicitud", solo los renderiza.
// `variante: 'chips'` (estilo marketplace, ADR de diseño 2026-07-10) — para filtros de alto uso
// como categoría; `'select'` (por defecto) se mantiene para el resto.
export interface DefinicionFiltro {
  campo: string;
  etiqueta: string;
  opciones: OpcionSelect[];
  variante?: 'select' | 'chips';
}

interface FiltroPanelProps {
  definiciones: DefinicionFiltro[];
  valores: Record<string, string>;
  onCambiar: (campo: string, valor: string) => void;
}

export function FiltroPanel({ definiciones, valores, onCambiar }: FiltroPanelProps): JSX.Element {
  return (
    <div className="filtro-panel">
      {definiciones.map((definicion) =>
        definicion.variante === 'chips' ? (
          <div key={definicion.campo} className="chips" role="group" aria-label={definicion.etiqueta}>
            <button
              type="button"
              className={`chip ${!valores[definicion.campo] ? 'chip--activo' : ''}`}
              onClick={() => onCambiar(definicion.campo, '')}
            >
              Todas
            </button>
            {definicion.opciones.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                className={`chip ${valores[definicion.campo] === opcion.valor ? 'chip--activo' : ''}`}
                onClick={() => onCambiar(definicion.campo, opcion.valor)}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        ) : (
          <select
            key={definicion.campo}
            aria-label={definicion.etiqueta}
            value={valores[definicion.campo] ?? ''}
            onChange={(e) => onCambiar(definicion.campo, e.target.value)}
          >
            <option value="">{definicion.etiqueta}</option>
            {definicion.opciones.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        ),
      )}
    </div>
  );
}
