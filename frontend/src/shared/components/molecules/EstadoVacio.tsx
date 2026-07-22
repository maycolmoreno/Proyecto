import { Link } from 'react-router-dom';
import { Button } from '@shared/components/atoms/Button';

interface AccionEstadoVacio {
  texto: string;
  /** Navega si viene una ruta; si no, se trata como botón con onClick (ej. "Limpiar filtros"). */
  to?: string;
  onClick?: () => void;
}

interface EstadoVacioProps {
  icono: string;
  titulo: string;
  descripcion?: string;
  accion?: AccionEstadoVacio;
  /** Clase extra para variantes de tamaño/posición (ej. altura de panel de chat) sin duplicar los
   * estilos base de .estado-vacio. */
  className?: string;
}

// Reemplaza el antiguo <p className="estado-lista"> para el caso "lista vacía" (auditoría de
// espacio muerto 2026-07-21) — ese mismo bloque seguía usándose solo, sin icono ni acción, en 7+
// listados. Cargando/error siguen siendo <p className="estado-lista"> simple: son estados breves,
// no la pantalla que el usuario se queda mirando.
export function EstadoVacio({ icono, titulo, descripcion, accion, className }: EstadoVacioProps): JSX.Element {
  return (
    <div className={['estado-vacio', className].filter(Boolean).join(' ')}>
      <span className="estado-vacio__icono" aria-hidden="true">
        {icono}
      </span>
      <p className="estado-vacio__titulo">{titulo}</p>
      {descripcion ? <p className="estado-vacio__descripcion">{descripcion}</p> : null}
      {accion ? (
        accion.to ? (
          <Link to={accion.to}>
            <Button type="button">{accion.texto}</Button>
          </Link>
        ) : (
          <Button type="button" variant="secundario" onClick={accion.onClick}>
            {accion.texto}
          </Button>
        )
      ) : null}
    </div>
  );
}
