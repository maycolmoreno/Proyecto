import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { UbicacionRetiro } from '../types/index.js';

const COLOR_MARCADOR = '#e85d2f';
const ZOOM_UBICACION = 14;

interface DonationLocationProps {
  ubicacionRetiro: UbicacionRetiro | null;
}

// Rediseño de DonacionDetallePage (2026-07-23) — mismo patrón que MapaPage (react-leaflet +
// CircleMarker, sin Marker para no necesitar el fix del ícono default de Leaflet). Solo se monta un
// mapa cuando el backend efectivamente envió latitud/longitud (ADR-019: eso solo pasa para el dueño
// o un admin, ver ObtenerDonacionUseCase). Para cualquier otro caso se muestra una tarjeta con
// provincia/ciudad/sector — nunca una dirección exacta ni un mapa inventado.
export function DonationLocation({ ubicacionRetiro }: DonationLocationProps): JSX.Element | null {
  if (!ubicacionRetiro) return null;

  const { latitud, longitud } = ubicacionRetiro;

  if (typeof latitud === 'number' && typeof longitud === 'number') {
    return (
      <div className="tarjeta donacion-seccion donacion-mapa">
        <h3>Ubicación de retiro</h3>
        <MapContainer center={[latitud, longitud]} zoom={ZOOM_UBICACION} scrollWheelZoom={false} className="donacion-mapa__mapa">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker
            center={[latitud, longitud]}
            radius={12}
            pathOptions={{ color: COLOR_MARCADOR, fillColor: COLOR_MARCADOR, fillOpacity: 0.5, weight: 2 }}
          >
            <Popup>
              {ubicacionRetiro.ciudad}, {ubicacionRetiro.provincia}
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>
    );
  }

  return (
    <div className="tarjeta donacion-seccion">
      <h3>Ubicación de retiro</h3>
      <p className="donacion-seccion__texto-libre">
        {[ubicacionRetiro.ciudad, ubicacionRetiro.sector, ubicacionRetiro.provincia].filter(Boolean).join(', ')}
      </p>
      <p className="donacion-seccion__vacio">La ubicación exacta solo la ve el donante — coordina el punto de encuentro por chat.</p>
    </div>
  );
}
