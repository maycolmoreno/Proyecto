import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

// Componente reutilizable (ADR-045): notificaciones efímeras (éxito/error) tras una acción.
type TipoToast = 'info' | 'exito' | 'error';

interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

interface ToastContextValor {
  mostrarToast: (mensaje: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValor | null>(null);

const DURACION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrarToast = useCallback((mensaje: string, tipo: TipoToast = 'info') => {
    const id = Date.now();
    setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((actuales) => actuales.filter((t) => t.id !== id));
    }, DURACION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="toast-contenedor" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.tipo !== 'info' ? `toast--${toast.tipo}` : ''}`} role="status">
            {toast.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValor {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider.');
  return contexto;
}
