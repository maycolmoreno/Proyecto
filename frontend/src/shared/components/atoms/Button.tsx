import type { ButtonHTMLAttributes } from 'react';

// Componente reutilizable (ADR-045): puramente presentacional, todo por props.
export type ButtonVariant = 'primario' | 'secundario' | 'peligro';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const estilosPorVariante: Record<ButtonVariant, string> = {
  primario: 'btn btn--primario',
  secundario: 'btn btn--secundario',
  peligro: 'btn btn--peligro',
};

export function Button({ variant = 'primario', className, ...props }: ButtonProps): JSX.Element {
  const clases = [estilosPorVariante[variant], className].filter(Boolean).join(' ');
  return <button className={clases} {...props} />;
}
