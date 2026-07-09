import { Link } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { claseUrgencia, type Urgencia } from '@shared/lib/estado-color';

// Componente reutilizable (ADR-045): usado en los 3 listados (donación/solicitud/trueque), Fase 5
// sección 3. Recibe todo por props — no sabe de qué dominio vienen los datos.
interface PublicacionCardProps {
  rutaDetalle: string;
  titulo: string;
  imagenUrl?: string;
  estado: string;
  ubicacion?: string;
  urgencia?: Urgencia;
}

export function PublicacionCard({
  rutaDetalle,
  titulo,
  imagenUrl,
  estado,
  ubicacion,
  urgencia,
}: PublicacionCardProps): JSX.Element {
  return (
    <Link to={rutaDetalle} className="publicacion-card">
      <div className="publicacion-card__imagen">
        {imagenUrl ? <img src={imagenUrl} alt="" /> : <span aria-hidden="true">📦</span>}
      </div>
      <div className="publicacion-card__cuerpo">
        <p className="publicacion-card__titulo">{titulo}</p>
        <div className="publicacion-card__badges">
          <StatusBadge estado={estado} />
          {urgencia ? <span className={claseUrgencia(urgencia)}>{urgencia}</span> : null}
        </div>
        {ubicacion ? <p className="publicacion-card__ubicacion">📍 {ubicacion}</p> : null}
      </div>
    </Link>
  );
}
