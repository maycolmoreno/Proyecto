// Componente reutilizable (ADR-045): tarjetas seleccionables (ícono + título + descripción) en vez
// de un <select> tradicional. Puramente presentacional — el dominio (Urgencia, EstadoObjeto, etc.)
// decide las opciones y qué valor emitir; este componente no conoce ningún tipo de negocio.
export interface OpcionTarjeta {
  valor: string;
  etiqueta: string;
  descripcion: string;
  icono: string;
}

interface SelectorTarjetasProps {
  label: string;
  opciones: OpcionTarjeta[];
  value: string;
  onChange: (valor: string) => void;
}

export function SelectorTarjetas({ label, opciones, value, onChange }: SelectorTarjetasProps): JSX.Element {
  return (
    <div className="form-field">
      <span className="selector-tarjetas__label">{label}</span>
      <div className="selector-tarjetas" role="radiogroup" aria-label={label}>
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={value === opcion.valor}
            className={`selector-tarjeta${value === opcion.valor ? ' selector-tarjeta--activa' : ''}`}
            onClick={() => onChange(opcion.valor)}
          >
            <span className="selector-tarjeta__icono" aria-hidden="true">
              {opcion.icono}
            </span>
            <span className="selector-tarjeta__titulo">{opcion.etiqueta}</span>
            <span className="selector-tarjeta__descripcion">{opcion.descripcion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
