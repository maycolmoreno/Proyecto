import type { OpcionSelect } from '@shared/components/atoms/Select';

// Componente reutilizable (ADR-045): filtros de listado, configurable por dominio vía props
// (Fase 4, sección 8) — no sabe qué filtros son "de Donación" vs "de Solicitud", solo los renderiza.
// `variante: 'chips'` (estilo marketplace, ADR de diseño 2026-07-10) — para filtros de alto uso
// como categoría; `'select'` (por defecto) se mantiene para el resto.
export interface DefinicionFiltro {
  campo: string;
  etiqueta: string;
  /** No aplica (ni se usa) con `variante: 'texto'` — no hay opciones fijas que listar. */
  opciones?: OpcionSelect[];
  variante?: 'select' | 'chips' | 'texto';
}

interface FiltroPanelProps {
  definiciones: DefinicionFiltro[];
  valores: Record<string, string>;
  onCambiar: (campo: string, valor: string) => void;
}

export function FiltroPanel({ definiciones, valores, onCambiar }: FiltroPanelProps): JSX.Element {
  return (
    <div className="filtro-panel">
      {definiciones.map((definicion) => {
        if (definicion.variante === 'texto') {
          return (
            <input
              key={definicion.campo}
              type="text"
              aria-label={definicion.etiqueta}
              placeholder={definicion.etiqueta}
              value={valores[definicion.campo] ?? ''}
              onChange={(e) => onCambiar(definicion.campo, e.target.value)}
            />
          );
        }

        if (definicion.variante === 'chips') {
          return (
            <div key={definicion.campo} className="chips" role="group" aria-label={definicion.etiqueta}>
              <button
                type="button"
                className={`chip ${!valores[definicion.campo] ? 'chip--activo' : ''}`}
                onClick={() => onCambiar(definicion.campo, '')}
              >
                Todas
              </button>
              {(definicion.opciones ?? []).map((opcion) => (
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
          );
        }

        return (
          <select
            key={definicion.campo}
            aria-label={definicion.etiqueta}
            value={valores[definicion.campo] ?? ''}
            onChange={(e) => onCambiar(definicion.campo, e.target.value)}
          >
            <option value="">{definicion.etiqueta}</option>
            {(definicion.opciones ?? []).map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        );
      })}
    </div>
  );
}
