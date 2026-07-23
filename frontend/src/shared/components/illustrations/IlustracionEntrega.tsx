// Ilustración propia — camioneta de entrega, para la tarjeta de coordinación de entrega.
export function IlustracionEntrega(): JSX.Element {
  return (
    <svg viewBox="0 0 220 150" className="ilustracion" role="img" aria-hidden="true">
      <circle cx="110" cy="80" r="72" fill="var(--color-estado-neutral-bg)" />
      <ellipse cx="112" cy="128" rx="70" ry="7" fill="var(--color-borde)" opacity="0.6" />
      {/* Caja de carga */}
      <rect x="40" y="58" width="86" height="52" rx="6" fill="var(--color-primario)" />
      <rect x="52" y="72" width="20" height="20" rx="3" fill="var(--color-primario-oscuro)" opacity="0.5" />
      {/* Cabina */}
      <path d="M126 74h30l14 20v16h-44Z" fill="var(--color-secundario)" />
      <rect x="136" y="80" width="16" height="12" rx="2" fill="var(--color-estado-neutral-bg)" />
      {/* Corazón en la caja */}
      <path
        d="M83 76c-2.5-4.5-9.5-5.5-12.5-1-3 4-0.5 9 12.5 17 13-8 15.5-13 12.5-17-3-4.5-10-3.5-12.5 1Z"
        fill="var(--color-acento)"
      />
      {/* Ruedas */}
      <circle cx="66" cy="112" r="12" fill="var(--color-texto)" />
      <circle cx="66" cy="112" r="5" fill="var(--color-estado-neutral-bg)" />
      <circle cx="150" cy="112" r="12" fill="var(--color-texto)" />
      <circle cx="150" cy="112" r="5" fill="var(--color-estado-neutral-bg)" />
      {/* Líneas de movimiento */}
      <rect x="8" y="70" width="18" height="4" rx="2" fill="var(--color-secundario)" opacity="0.6" />
      <rect x="14" y="82" width="14" height="4" rx="2" fill="var(--color-secundario)" opacity="0.4" />
    </svg>
  );
}
