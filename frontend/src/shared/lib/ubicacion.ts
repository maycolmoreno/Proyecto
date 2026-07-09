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
