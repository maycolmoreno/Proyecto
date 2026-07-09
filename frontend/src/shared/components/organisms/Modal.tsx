import type { ReactNode } from 'react';
import { Button } from '@shared/components/atoms/Button';

// Componente reutilizable (ADR-045): confirmaciones destructivas (cancelar publicación, etc.).
interface ModalProps {
  titulo: string;
  children: ReactNode;
  onCerrar: () => void;
  onConfirmar?: () => void;
  textoConfirmar?: string;
  confirmando?: boolean;
}

export function Modal({
  titulo,
  children,
  onCerrar,
  onConfirmar,
  textoConfirmar = 'Confirmar',
  confirmando,
}: ModalProps): JSX.Element {
  return (
    <div className="modal-overlay" role="presentation" onClick={onCerrar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo">{titulo}</h2>
        {children}
        <div className="modal__acciones">
          <Button variant="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          {onConfirmar ? (
            <Button variant="peligro" onClick={onConfirmar} disabled={confirmando}>
              {confirmando ? 'Procesando…' : textoConfirmar}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
