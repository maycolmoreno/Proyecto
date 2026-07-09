// Ítems de navegación principal (Fase 5, sección 1) — mismos 8 del SRS (IF-USR-003), Ubicación
// vive como tab dentro de /perfil, no como ítem propio.
export interface NavItem {
  ruta: string;
  etiqueta: string;
  icono: string;
}

export const NAV_ITEMS: NavItem[] = [
  { ruta: '/', etiqueta: 'Inicio', icono: '🏠' },
  { ruta: '/donaciones', etiqueta: 'Donaciones', icono: '🎁' },
  { ruta: '/solicitudes', etiqueta: 'Solicitudes', icono: '🙏' },
  { ruta: '/trueques', etiqueta: 'Trueque', icono: '🔄' },
  { ruta: '/chatbot', etiqueta: 'Chatbot IA', icono: '💬' },
  { ruta: '/conversaciones', etiqueta: 'Mensajes', icono: '✉️' },
  { ruta: '/perfil', etiqueta: 'Perfil', icono: '👤' },
];

// Mobile <768px: bottom tab bar con los 5 ítems más frecuentes + "Más" agrupa el resto.
export const NAV_ITEMS_MOBILE = NAV_ITEMS.slice(0, 5);
export const NAV_ITEMS_MAS = NAV_ITEMS.slice(5);
