// Formato de fechas/horas para Mensajería (RF-017/CU-015) — mismo locale 'es-EC' usado en
// PerfilPage. Centralizado acá porque lo necesitan tanto la lista de conversaciones (hora del
// último mensaje) como el hilo (separadores de día + hora por mensaje).
function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function esAyer(fecha: Date): boolean {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return esMismoDia(fecha, ayer);
}

export function formatearHora(fechaISO: string): string {
  return new Date(fechaISO).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

/** Para la lista de conversaciones: hora si el último mensaje fue hoy, "Ayer", o fecha corta. */
export function formatearUltimaActividad(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  if (esMismoDia(fecha, new Date())) return formatearHora(fechaISO);
  if (esAyer(fecha)) return 'Ayer';
  return fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

/** Para los separadores de día dentro del hilo de mensajes. */
export function formatearEncabezadoDia(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  if (esMismoDia(fecha, new Date())) return 'Hoy';
  if (esAyer(fecha)) return 'Ayer';
  return fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function mismoDia(aISO: string, bISO: string): boolean {
  return esMismoDia(new Date(aISO), new Date(bISO));
}
