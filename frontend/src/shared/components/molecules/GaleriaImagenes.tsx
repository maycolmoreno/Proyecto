import { useState } from 'react';

interface GaleriaImagenesProps {
  imagenes: string[];
}

// Antes las páginas de detalle solo mostraban imagenes[0] — el resto de las fotos que el dueño
// subió quedaban invisibles para cualquier otra persona (auditoría de espacio muerto 2026-07-21,
// pedido explícito del usuario sobre el detalle de Donación).
export function GaleriaImagenes({ imagenes }: GaleriaImagenesProps): JSX.Element {
  const [activa, setActiva] = useState(0);
  const actual = imagenes[activa];

  return (
    <div className="galeria-imagenes">
      <div className="publicacion-card__imagen detalle-imagen-hero">
        {actual ? <img src={actual} alt="" /> : <span aria-hidden="true">📦</span>}
      </div>
      {imagenes.length > 1 ? (
        <div className="galeria-imagenes__miniaturas">
          {imagenes.map((url, i) => (
            <button
              key={url}
              type="button"
              className={`galeria-imagenes__miniatura${i === activa ? ' galeria-imagenes__miniatura--activa' : ''}`}
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1} de ${imagenes.length}`}
              aria-current={i === activa}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
