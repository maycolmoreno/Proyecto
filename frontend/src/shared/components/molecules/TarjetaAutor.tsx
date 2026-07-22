import type { ReactNode } from 'react';
import { Avatar } from '@shared/components/atoms/Avatar';

interface TarjetaAutorProps {
  nombre: string;
  /** ISO de fechaCreacion del usuario — "Miembro desde" da contexto de confianza que antes no
   * existía en el detalle (auditoría de espacio muerto 2026-07-21, pedido del usuario). */
  miembroDesde?: string;
  /** Acción asociada (ej. "Enviar mensaje") — la decide cada página, esta tarjeta solo es identidad. */
  children?: ReactNode;
}

export function TarjetaAutor({ nombre, miembroDesde, children }: TarjetaAutorProps): JSX.Element {
  return (
    <div className="tarjeta-autor">
      <Avatar nombre={nombre} />
      <div className="tarjeta-autor__info">
        <p className="tarjeta-autor__nombre">{nombre}</p>
        {miembroDesde ? (
          <p className="tarjeta-autor__miembro-desde">
            Miembro desde {new Date(miembroDesde).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
          </p>
        ) : null}
      </div>
      {children ? <div className="tarjeta-autor__accion">{children}</div> : null}
    </div>
  );
}
