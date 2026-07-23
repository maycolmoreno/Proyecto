// Ilustración propia (sin librería externa, sin herramienta de generación de imágenes disponible
// en este entorno) — un paquete con un corazón, para el hero del detalle de Solicitud. Colores vía
// var(--color-*) para que seleccione automáticamente la paleta clara/oscura de la app.
export function IlustracionSolicitud(): JSX.Element {
  return (
    <svg viewBox="0 0 220 180" className="ilustracion" role="img" aria-hidden="true">
      <circle cx="110" cy="95" r="80" fill="var(--color-estado-neutral-bg)" />
      {/* Sombra del paquete */}
      <ellipse cx="110" cy="152" rx="52" ry="8" fill="var(--color-borde)" opacity="0.6" />
      {/* Cuerpo de la caja */}
      <rect x="60" y="90" width="100" height="60" rx="6" fill="var(--color-acento)" />
      <rect x="60" y="90" width="100" height="16" fill="var(--color-primario)" />
      {/* Cinta */}
      <rect x="102" y="90" width="16" height="60" fill="var(--color-primario-oscuro)" opacity="0.85" />
      {/* Solapas abiertas */}
      <path d="M60 90 L48 62 L96 74 L102 90 Z" fill="var(--color-primario)" />
      <path d="M160 90 L172 62 L124 74 L118 90 Z" fill="var(--color-primario-oscuro)" />
      {/* Corazón flotando sobre la caja */}
      <path
        d="M110 48c-4-8-16-10-21-2-5 7-1 15 21 30 22-15 26-23 21-30-5-8-17-6-21 2Z"
        fill="var(--color-secundario)"
      />
      {/* Destellos */}
      <path d="M164 50l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="var(--color-secundario)" opacity="0.8" />
      <path d="M50 110l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="var(--color-primario)" opacity="0.7" />
    </svg>
  );
}
