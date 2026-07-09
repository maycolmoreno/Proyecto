import type { SelectHTMLAttributes } from 'react';

// Componente reutilizable (ADR-045): mismo patrón que Input/TextArea.
export interface OpcionSelect {
  valor: string;
  etiqueta: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  error?: string;
  opciones: OpcionSelect[];
  placeholder?: string;
}

export function Select({ label, error, id, opciones, placeholder, ...props }: SelectProps): JSX.Element {
  const selectId = id ?? props.name;
  return (
    <div className="form-field">
      <label htmlFor={selectId}>{label}</label>
      <select id={selectId} aria-invalid={Boolean(error)} {...props}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="form-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
