// Tipo compartido — mismo shape que `ubicacionRetiro` (Donación) y `ubicacion` (Solicitud),
// Fase 3 (VO Ubicación reutilizado, Fase 2 sección 3).
export interface UbicacionInput {
  provincia: string;
  ciudad: string;
  sector?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
}

// Las 24 provincias del Ecuador (dato geográfico fijo, no de negocio).
export const PROVINCIAS_ECUADOR = [
  'Azuay',
  'Bolívar',
  'Cañar',
  'Carchi',
  'Chimborazo',
  'Cotopaxi',
  'El Oro',
  'Esmeraldas',
  'Galápagos',
  'Guayas',
  'Imbabura',
  'Loja',
  'Los Ríos',
  'Manabí',
  'Morona Santiago',
  'Napo',
  'Orellana',
  'Pastaza',
  'Pichincha',
  'Santa Elena',
  'Santo Domingo de los Tsáchilas',
  'Sucumbíos',
  'Tungurahua',
  'Zamora Chinchipe',
];

const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase()
    .replace(/^provincia de /, '')
    .trim();
}

function buscarProvincia(nombre: string | undefined): string | undefined {
  if (!nombre) return undefined;
  const objetivo = normalizar(nombre);
  return PROVINCIAS_ECUADOR.find((p) => normalizar(p) === objetivo);
}

export interface UbicacionGeocodificada {
  provincia?: string;
  ciudad?: string;
}

// Geocodificación inversa vía Nominatim (OpenStreetMap) — sin API key, uso liviano
// desde el navegador (IF-HW-002). Si falla o no hay match, se resuelve con campos vacíos
// y el usuario completa manualmente (los campos del LocationPicker siguen editables).
export async function geocodificarInversa(
  latitud: number,
  longitud: number,
): Promise<UbicacionGeocodificada> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitud}&lon=${longitud}&addressdetails=1&zoom=14`;
  const respuesta = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!respuesta.ok) throw new Error('No se pudo geocodificar la ubicación.');
  const datos = await respuesta.json();
  const direccion = datos?.address ?? {};
  // Nominatim normalmente expone la provincia en "state", pero para algunas provincias
  // de Ecuador (ej. Pichincha) el dato viene en "state_district"/"plot"/"region" en su lugar
  // (comprobado en vivo contra la API — es una particularidad del etiquetado en OSM, no un bug propio).
  const provincia = buscarProvincia(
    direccion.state ?? direccion.state_district ?? direccion.region ?? direccion.plot,
  );
  const ciudad: string | undefined =
    direccion.city ?? direccion.town ?? direccion.village ?? direccion.municipality ?? direccion.county;
  return { provincia, ciudad };
}
