// Ilustración propia — manos abstractas sosteniendo un corazón, para la tarjeta de impacto.
// Mismo criterio que IlustracionSolicitud: formas geométricas simples, sin librería externa.
export function IlustracionImpacto(): JSX.Element {
  return (
    <svg viewBox="0 0 200 150" className="ilustracion" role="img" aria-hidden="true">
      <circle cx="100" cy="80" r="68" fill="var(--color-estado-neutral-bg)" />
      {/* Mano izquierda (abstracta: palma + 3 dedos redondeados) */}
      <g fill="var(--color-secundario)">
        <path d="M40 118c-10-2-18-12-18-24 0-14 10-26 24-26h4v-14a8 8 0 0 1 16 0v34h-4l-2-30a6 6 0 0 0-12 0v30h-8Z" />
        <rect x="46" y="70" width="14" height="40" rx="7" />
      </g>
      {/* Mano derecha (espejo) */}
      <g fill="var(--color-secundario-oscuro)">
        <path d="M160 118c10-2 18-12 18-24 0-14-10-26-24-26h-4v-14a8 8 0 0 0-16 0v34h4l2-30a6 6 0 0 1 12 0v30h8Z" />
        <rect x="140" y="70" width="14" height="40" rx="7" />
      </g>
      {/* Corazón sostenido */}
      <path
        d="M100 56c-5-9-19-11-25-2-6 8-1 18 25 36 26-18 31-28 25-36-6-9-20-7-25 2Z"
        fill="var(--color-primario)"
      />
      <path d="M158 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="var(--color-acento)" />
      <path d="M34 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="var(--color-acento)" />
    </svg>
  );
}
