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
  function obtenerResumen(definicion: DefinicionFiltro): string {
    const valor = valores[definicion.campo];
    if (!valor) return 'Todas';
    if (definicion.variante === 'texto') return valor;
    return definicion.opciones?.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;
  }

  return (
    <div className="filtro-panel">
      {definiciones.map((definicion) => {
        if (definicion.variante === 'texto') {
          return (
            <details key={definicion.campo} className="filtro-panel__item">
              <summary>
                <span>{definicion.etiqueta}</span>
                <strong>{obtenerResumen(definicion)}</strong>
              </summary>
              <label className="filtro-panel__campo" aria-label={definicion.etiqueta}>
                <input
                  type="text"
                  placeholder={`Escribe una ${definicion.etiqueta.toLowerCase()}`}
                  value={valores[definicion.campo] ?? ''}
                  onChange={(e) => onCambiar(definicion.campo, e.target.value)}
                />
              </label>
            </details>
          );
        }

        if (definicion.variante === 'chips') {
          return (
            <details key={definicion.campo} className="filtro-panel__item">
              <summary>
                <span>{definicion.etiqueta}</span>
                <strong>{obtenerResumen(definicion)}</strong>
              </summary>
              <div className="filtro-panel__grupo">
                <div className="chips" role="group" aria-label={definicion.etiqueta}>
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
              </div>
            </details>
          );
        }

        return (
          <details key={definicion.campo} className="filtro-panel__item">
            <summary>
              <span>{definicion.etiqueta}</span>
              <strong>{obtenerResumen(definicion)}</strong>
            </summary>
            <label className="filtro-panel__campo" aria-label={definicion.etiqueta}>
              <select value={valores[definicion.campo] ?? ''} onChange={(e) => onCambiar(definicion.campo, e.target.value)}>
                <option value="">Todas</option>
                {(definicion.opciones ?? []).map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </details>
        );
      })}
    </div>
  );
}
