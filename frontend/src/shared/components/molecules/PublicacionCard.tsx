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
        {/* Insignia superpuesta estilo "etiqueta de mercado" (elemento de firma, dirección visual
            2026-07-10) — sobre la foto, no debajo, mismo patrón que las etiquetas de envío de los
            marketplaces de referencia (Mercado Libre/OLX). */}
        <div className="publicacion-card__etiqueta">
          <StatusBadge estado={estado} />
        </div>
      </div>
      <div className="publicacion-card__cuerpo">
        <p className="publicacion-card__titulo">{titulo}</p>
        {urgencia ? <span className={claseUrgencia(urgencia)}>{urgencia}</span> : null}
        {ubicacion ? <p className="publicacion-card__ubicacion">📍 {ubicacion}</p> : null}
      </div>
    </Link>
  );
}
