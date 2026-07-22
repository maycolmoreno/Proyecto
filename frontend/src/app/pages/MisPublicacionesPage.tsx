import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { useMisPublicaciones } from '@features/publicaciones/hooks/useMisPublicaciones';
import type { TipoPublicacion } from '@features/publicaciones/types/index.js';

const ETIQUETA_TIPO: Record<TipoPublicacion, string> = {
  DONACION: 'Donación',
  SOLICITUD: 'Solicitud',
  TRUEQUE: 'Trueque',
};

const RUTA_DETALLE: Record<TipoPublicacion, (id: string) => string> = {
  DONACION: (id) => `/donaciones/${id}`,
  SOLICITUD: (id) => `/solicitudes/${id}`,
  TRUEQUE: (id) => `/trueques/${id}`,
};

// Fase 5 diferida (docs/DISENO_MODELO_PERFILES.md sección 7) — feed único de las 3 publicaciones
// propias, ordenado por fecha (ya viene ordenado del backend). No agrupa por tipo: la etiqueta en
// cada tarjeta (PublicacionCard.etiquetaTipo) es lo que distingue el tipo dentro del mismo feed.
export function MisPublicacionesPage(): JSX.Element {
  const publicaciones = useMisPublicaciones();

  return (
    <div>
      <div className="pagina-encabezado">
        <h1>Mis publicaciones</h1>
      </div>
      <p className="aviso-info">
        El estado mostrado puede no reflejar cambios muy recientes — para el estado más actualizado, entra al detalle de
        cada publicación.
      </p>

      {publicaciones.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {publicaciones.isError ? <p className="estado-lista">No se pudo cargar tu historial de publicaciones.</p> : null}
      {publicaciones.data && publicaciones.data.length === 0 ? (
        <p className="estado-lista">Todavía no has publicado ninguna donación, solicitud o trueque.</p>
      ) : null}

      {publicaciones.data && publicaciones.data.length > 0 ? (
        <div className="grid-publicaciones">
          {publicaciones.data.map((publicacion) => (
            <PublicacionCard
              key={`${publicacion.tipo}-${publicacion.id}`}
              rutaDetalle={RUTA_DETALLE[publicacion.tipo](publicacion.id)}
              titulo={publicacion.titulo}
              estado={publicacion.estado}
              etiquetaTipo={ETIQUETA_TIPO[publicacion.tipo]}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
