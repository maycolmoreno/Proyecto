import { PROVINCIAS_ECUADOR } from './ubicacion';

// Centroides aproximados (coordenadas de la capital de cada provincia) — dato geográfico de
// referencia público, no de negocio. Usado solo para agrupar visualmente en MapaPage; no
// reemplaza la ubicación real de ninguna publicación (que el backend nunca expone en listados,
// ver ADR-019). Mismas 24 provincias y mismo orden que PROVINCIAS_ECUADOR (shared/lib/ubicacion.ts).
export const COORDENADAS_PROVINCIA: Record<(typeof PROVINCIAS_ECUADOR)[number], [number, number]> = {
  Azuay: [-2.9006, -79.0045],
  Bolívar: [-1.5905, -79.0016],
  Cañar: [-2.7362, -78.8486],
  Carchi: [0.8114, -77.7173],
  Chimborazo: [-1.6635, -78.6546],
  Cotopaxi: [-0.9345, -78.6155],
  'El Oro': [-3.2581, -79.9553],
  Esmeraldas: [0.9592, -79.6532],
  Galápagos: [-0.9018, -89.6089],
  Guayas: [-2.1894, -79.8891],
  Imbabura: [0.3517, -78.1223],
  Loja: [-3.9931, -79.2042],
  'Los Ríos': [-1.8021, -79.5346],
  Manabí: [-1.0546, -80.453],
  'Morona Santiago': [-2.3089, -78.1141],
  Napo: [-0.9936, -77.8136],
  Orellana: [-0.4653, -76.9836],
  Pastaza: [-1.4835, -77.9976],
  Pichincha: [-0.1807, -78.4678],
  'Santa Elena': [-2.227, -80.8586],
  'Santo Domingo de los Tsáchilas': [-0.2528, -79.175],
  Sucumbíos: [0.0847, -76.8892],
  Tungurahua: [-1.2417, -78.6197],
  'Zamora Chinchipe': [-4.0669, -78.9558],
};

// Centro y zoom inicial del mapa (Ecuador continental completo).
export const CENTRO_ECUADOR: [number, number] = [-1.5, -78.5];
export const ZOOM_INICIAL_ECUADOR = 6;
