import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useDonaciones } from '@features/donaciones/hooks/useDonaciones';
import { useSolicitudes } from '@features/solicitudes/hooks/useSolicitudes';
import { PROVINCIAS_ECUADOR } from '@shared/lib/ubicacion';
import { COORDENADAS_PROVINCIA, CENTRO_ECUADOR, ZOOM_INICIAL_ECUADOR } from '@shared/lib/provincias-coordenadas';

// Color copiado de --color-primario (index.css) — Leaflet dibuja el marcador como atributo SVG,
// no soporta var(--...) ahí, así que no puede leer el custom property directamente.
const COLOR_MARCADOR = '#e85d2f';

interface ConteoProvincia {
  donaciones: number;
  solicitudes: number;
}

// Mapa agregado por provincia, no por publicación individual — GET /donaciones y GET /solicitudes
// nunca devuelven latitud/longitud en el listado (ni siquiera al dueño autenticado, verificado en
// ListarDonacionesUseCase.ts/ListarSolicitudesUseCase.ts: incluirUbicacionExacta va hardcodeado en
// false), así que un mapa con un pin por publicación exigiría un cambio de backend. Este mapa usa
// solo provincia/ciudad, que sí viajan siempre, y respeta la misma privacidad que ya aplica en toda
// la app (ADR-019). Los trueques no aparecen: Trueque no tiene ningún campo de ubicación en el
// modelo actual.
export function MapaPage(): JSX.Element {
  const donaciones = useDonaciones({ estado: 'PUBLICADA', limit: 100 });
  const solicitudes = useSolicitudes({ estado: 'ABIERTA', limit: 100 });
  const cargando = donaciones.isLoading || solicitudes.isLoading;

  const conteoPorProvincia = new Map<string, ConteoProvincia>(
    PROVINCIAS_ECUADOR.map((p) => [p, { donaciones: 0, solicitudes: 0 }]),
  );

  for (const d of donaciones.data?.data ?? []) {
    const provincia = d.ubicacionRetiro?.provincia;
    if (provincia && conteoPorProvincia.has(provincia)) {
      conteoPorProvincia.get(provincia)!.donaciones += 1;
    }
  }
  for (const s of solicitudes.data?.data ?? []) {
    if (conteoPorProvincia.has(s.ubicacion.provincia)) {
      conteoPorProvincia.get(s.ubicacion.provincia)!.solicitudes += 1;
    }
  }

  // Ranking textual al lado del mapa (auditoría de espacio muerto 2026-07-21) — mismos datos ya
  // agregados que alimentan los círculos, sin pedir nada nuevo al backend.
  const ranking = PROVINCIAS_ECUADOR.map((provincia) => {
    const conteo = conteoPorProvincia.get(provincia)!;
    return { provincia, ...conteo, total: conteo.donaciones + conteo.solicitudes };
  })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div>
      <div className="pagina-encabezado">
        <h1>Mapa de publicaciones</h1>
      </div>
      <p className="mapa-pagina__ayuda">
        Cantidad de donaciones y solicitudes activas por provincia. La ubicación exacta de cada
        publicación nunca se muestra públicamente — solo se agrega por provincia.
      </p>

      {cargando ? <p className="estado-lista">Cargando mapa…</p> : null}

      <div className="mapa-pagina__diseno">
        <div className="mapa-pagina__contenedor">
          <MapContainer
            center={CENTRO_ECUADOR}
            zoom={ZOOM_INICIAL_ECUADOR}
            scrollWheelZoom={false}
            className="mapa-pagina__mapa"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {PROVINCIAS_ECUADOR.map((provincia) => {
              const conteo = conteoPorProvincia.get(provincia)!;
              const total = conteo.donaciones + conteo.solicitudes;
              if (total === 0) return null;
              // Non-null: PROVINCIAS_ECUADOR y COORDENADAS_PROVINCIA comparten exactamente las
              // mismas 24 claves (provincias-coordenadas.ts), TS no puede inferirlo desde .map().
              const [lat, lng] = COORDENADAS_PROVINCIA[provincia]!;
              return (
                <CircleMarker
                  key={provincia}
                  center={[lat, lng]}
                  radius={Math.min(8 + total * 3, 36)}
                  pathOptions={{ color: COLOR_MARCADOR, fillColor: COLOR_MARCADOR, fillOpacity: 0.45, weight: 2 }}
                >
                  <Popup>
                    <strong>{provincia}</strong>
                    <br />
                    🎁 {conteo.donaciones} {conteo.donaciones === 1 ? 'donación' : 'donaciones'}
                    <br />
                    🙏 {conteo.solicitudes} {conteo.solicitudes === 1 ? 'solicitud' : 'solicitudes'}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <aside className="mapa-pagina__panel">
          <div>
            <h2>Provincias con más actividad</h2>
            {ranking.length === 0 ? (
              <p className="mapa-pagina__panel-vacio">Todavía no hay publicaciones activas con ubicación.</p>
            ) : (
              <ol className="mapa-pagina__ranking">
                {ranking.map((p, i) => (
                  <li key={p.provincia}>
                    <span className="mapa-pagina__ranking-puesto">{i + 1}</span>
                    <span className="mapa-pagina__ranking-provincia">{p.provincia}</span>
                    <span className="mapa-pagina__ranking-total">{p.total}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="mapa-pagina__leyenda">
            <p className="mapa-pagina__leyenda-titulo">Cómo leer el mapa</p>
            <p>El tamaño de cada círculo representa el total de donaciones y solicitudes activas en esa provincia.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
