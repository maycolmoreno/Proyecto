import { useEffect, useState, type ReactNode } from 'react';

// Rediseño de DonacionDetallePage (2026-07-23) — reemplaza <GaleriaImagenes> (shared) SOLO en esta
// página: ese componente lo usa también TruequeDetallePage, así que ampliarlo ahí habría cambiado
// una página fuera de alcance. `imagenes` sigue viniendo tal cual de donacion.data.imagenes (RTQ),
// sin datos simulados.
interface DonationGalleryProps {
  imagenes: string[];
  titulo: string;
  /** Insignia de estado (ej. <StatusBadge estado="PUBLICADA" />) superpuesta arriba a la derecha. */
  estadoBadge?: ReactNode;
}

export function DonationGallery({ imagenes, titulo, estadoBadge }: DonationGalleryProps): JSX.Element {
  const [activa, setActiva] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const total = imagenes.length;

  function anterior(): void {
    setActiva((i) => (i - 1 + total) % total);
  }

  function siguiente(): void {
    setActiva((i) => (i + 1) % total);
  }

  // Navegación por teclado dentro del lightbox — Escape cierra, flechas cambian de foto.
  useEffect(() => {
    if (!ampliada) return;
    function manejarTecla(e: KeyboardEvent): void {
      if (e.key === 'Escape') setAmpliada(false);
      if (e.key === 'ArrowLeft') anterior();
      if (e.key === 'ArrowRight') siguiente();
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ampliada, total]);

  if (total === 0) {
    return (
      <div className="donacion-galeria">
        <div className="donacion-galeria__principal donacion-galeria__placeholder">
          <span className="donacion-galeria__placeholder-icono" aria-hidden="true">
            📦
          </span>
          <p>Sin fotografías todavía</p>
        </div>
      </div>
    );
  }

  const urlActual = imagenes[activa]!;

  return (
    <div className="donacion-galeria">
      <div className="donacion-galeria__principal">
        {estadoBadge ? <div className="donacion-galeria__badge">{estadoBadge}</div> : null}

        <button
          type="button"
          className="donacion-galeria__boton-imagen"
          onClick={() => setAmpliada(true)}
          aria-label={`Ampliar imagen ${activa + 1} de ${total} de ${titulo}`}
        >
          <img src={urlActual} alt={`${titulo} — foto ${activa + 1} de ${total}`} loading="eager" />
        </button>

        {total > 1 ? (
          <>
            <button
              type="button"
              className="donacion-galeria__flecha donacion-galeria__flecha--anterior"
              onClick={anterior}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="donacion-galeria__flecha donacion-galeria__flecha--siguiente"
              onClick={siguiente}
              aria-label="Imagen siguiente"
            >
              ›
            </button>
            <span className="donacion-galeria__contador">
              {activa + 1} / {total}
            </span>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="donacion-galeria__miniaturas">
          {imagenes.map((url, i) => (
            <button
              key={url}
              type="button"
              className={`donacion-galeria__miniatura${i === activa ? ' donacion-galeria__miniatura--activa' : ''}`}
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1} de ${total}`}
              aria-current={i === activa}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}

      {ampliada ? (
        <div className="donacion-lightbox" role="dialog" aria-modal="true" aria-label={`${titulo} — imagen ampliada`}>
          <div className="donacion-lightbox__fondo" onClick={() => setAmpliada(false)} />
          <button type="button" className="donacion-lightbox__cerrar" onClick={() => setAmpliada(false)} aria-label="Cerrar imagen ampliada">
            ✕
          </button>
          {total > 1 ? (
            <button type="button" className="donacion-lightbox__flecha donacion-lightbox__flecha--anterior" onClick={anterior} aria-label="Imagen anterior">
              ‹
            </button>
          ) : null}
          <img src={urlActual} alt={`${titulo} — foto ${activa + 1} de ${total}`} className="donacion-lightbox__imagen" />
          {total > 1 ? (
            <button type="button" className="donacion-lightbox__flecha donacion-lightbox__flecha--siguiente" onClick={siguiente} aria-label="Imagen siguiente">
              ›
            </button>
          ) : null}
          {total > 1 ? (
            <span className="donacion-lightbox__contador">
              {activa + 1} / {total}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
