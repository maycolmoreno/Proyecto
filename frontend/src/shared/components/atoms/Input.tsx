import type { InputHTMLAttributes } from 'react';

// Componente reutilizable (ADR-045): label siempre visible, no solo placeholder (RNF-008).
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, ...props }: InputProps): JSX.Element {
  const inputId = id ?? props.name;
  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} aria-invalid={Boolean(error)} {...props} />
      {error ? (
        <p role="alert" className="form-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
