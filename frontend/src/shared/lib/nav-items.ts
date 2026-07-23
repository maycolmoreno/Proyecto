import type { IconName } from '@shared/components/atoms/Icon';

// Ítems de navegación principal (Fase 5, sección 1) — mismos 8 del SRS (IF-USR-003), Ubicación
// vive como tab dentro de /perfil, no como ítem propio.
export interface NavItem {
  ruta: string;
  etiqueta: string;
  icono: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { ruta: '/', etiqueta: 'Inicio', icono: 'home' },
  { ruta: '/donaciones', etiqueta: 'Donaciones', icono: 'gift' },
  { ruta: '/solicitudes', etiqueta: 'Solicitudes', icono: 'help' },
  { ruta: '/trueques', etiqueta: 'Trueque', icono: 'swap' },
  { ruta: '/chatbot', etiqueta: 'Asistente DonaConnect', icono: 'chat' },
  { ruta: '/conversaciones', etiqueta: 'Mensajes', icono: 'mail' },
  { ruta: '/perfil', etiqueta: 'Perfil', icono: 'user' },
];

// Mobile <768px: bottom tab bar con los 5 ítems más frecuentes + "Más" agrupa el resto.
export const NAV_ITEMS_MOBILE = NAV_ITEMS.slice(0, 5);
export const NAV_ITEMS_MAS = NAV_ITEMS.slice(5);
