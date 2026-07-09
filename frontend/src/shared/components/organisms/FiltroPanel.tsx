import type { OpcionSelect } from '@shared/components/atoms/Select';

// Componente reutilizable (ADR-045): filtros de listado, configurable por dominio vía props
// (Fase 4, sección 8) — no sabe qué filtros son "de Donación" vs "de Solicitud", solo los renderiza.
export interface DefinicionFiltro {
  campo: string;
  etiqueta: string;
  opciones: OpcionSelect[];
}

interface FiltroPanelProps {
  definiciones: DefinicionFiltro[];
  valores: Record<string, string>;
  onCambiar: (campo: string, valor: string) => void;
}

export function FiltroPanel({ definiciones, valores, onCambiar }: FiltroPanelProps): JSX.Element {
  return (
    <div className="filtro-panel">
      {definiciones.map((definicion) => (
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
      ))}
    </div>
  );
}
