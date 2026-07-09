import type { TextareaHTMLAttributes } from 'react';

// Componente reutilizable (ADR-045): mismo patrón que Input — label siempre visible (RNF-008).
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextArea({ label, error, id, ...props }: TextAreaProps): JSX.Element {
  const textareaId = id ?? props.name;
  return (
    <div className="form-field">
      <label htmlFor={textareaId}>{label}</label>
      <textarea id={textareaId} aria-invalid={Boolean(error)} rows={4} {...props} />
      {error ? (
        <p role="alert" className="form-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
