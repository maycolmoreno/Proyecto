import { Link } from 'react-router-dom';
import { Avatar } from '@shared/components/atoms/Avatar';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { claseUrgencia, type Urgencia } from '@shared/lib/estado-color';
import { formatearUltimaActividad } from '@shared/lib/fecha';

// Componente reutilizable (ADR-045): usado en los 3 listados (donación/solicitud/trueque), Fase 5
// sección 3. Recibe todo por props — no sabe de qué dominio vienen los datos.
interface PublicacionCardProps {
  rutaDetalle: string;
  titulo: string;
  imagenUrl?: string;
  estado: string;
  ubicacion?: string;
  urgencia?: Urgencia;
  /** Solo usado por "Mis publicaciones" (feed unificado de los 3 tipos) — los 3 listados existentes
   * no la pasan, así que su render no cambia. Sigue siendo puramente presentacional (ADR-045). */
  etiquetaTipo?: string;
  /** Nombre de la categoría (existe en los 3 tipos de dominio pero antes no se mostraba en ninguna
   * tarjeta de listado — auditoría de espacio muerto 2026-07-21). */
  categoria?: string;
  /** Fecha de publicación en ISO — se formatea con el mismo criterio que Mensajería. */
  fecha?: string;
  /** Nombre de quien publicó — sin avatar con foto ni reputación (no existen en el modelo de
   * Usuario hoy); solo iniciales vía Avatar. Opcional: los listados que no lo pasan no cambian. */
  autorNombre?: string;
  /** Solo Solicitudes lo pasa (único dominio con ofertas recibidas visibles en el listado). */
  cantidadOfertas?: number;
  /** Favoritos (opcional en los 3 listados) — `onToggleFavorito` ausente omite el botón entero. */
  favorito?: boolean;
  onToggleFavorito?: () => void;
}

export function PublicacionCard({
  rutaDetalle,
  titulo,
  imagenUrl,
  estado,
  ubicacion,
  urgencia,
  etiquetaTipo,
  categoria,
  fecha,
  autorNombre,
  cantidadOfertas,
  favorito,
  onToggleFavorito,
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
        {onToggleFavorito ? (
          <button
            type="button"
            className="publicacion-card__favorito"
            onClick={(e) => {
              // La tarjeta entera es un <Link> — sin esto, tocar el corazón también navegaría.
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorito();
            }}
            aria-label={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            aria-pressed={favorito}
          >
            {favorito ? '❤️' : '🤍'}
          </button>
        ) : null}
      </div>
      <div className="publicacion-card__cuerpo">
        <p className="publicacion-card__titulo">{titulo}</p>
        {urgencia || etiquetaTipo || categoria ? (
          <div className="publicacion-card__badges">
            {etiquetaTipo ? <span className="badge badge--tipo">{etiquetaTipo}</span> : null}
            {categoria ? <span className="badge badge--tipo">{categoria}</span> : null}
            {urgencia ? <span className={claseUrgencia(urgencia)}>{urgencia}</span> : null}
          </div>
        ) : null}
        {ubicacion ? <p className="publicacion-card__ubicacion">📍 {ubicacion}</p> : null}
        {fecha ? <p className="publicacion-card__fecha">🕓 {formatearUltimaActividad(fecha)}</p> : null}
        {autorNombre || cantidadOfertas !== undefined ? (
          <div className="publicacion-card__pie">
            {autorNombre ? (
              <span className="publicacion-card__autor">
                <Avatar nombre={autorNombre} />
                {autorNombre}
              </span>
            ) : null}
            {cantidadOfertas !== undefined ? (
              <span className="publicacion-card__ofertas">
                {cantidadOfertas} {cantidadOfertas === 1 ? 'oferta' : 'ofertas'}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
