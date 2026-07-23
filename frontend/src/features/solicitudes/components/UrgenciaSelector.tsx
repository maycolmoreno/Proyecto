import { SelectorTarjetas, type OpcionTarjeta } from '@shared/components/molecules/SelectorTarjetas';
import type { Urgencia } from '../types/index.js';

// Rediseño visual de "Publicar solicitud" (2026-07-22): reemplaza el <select> de urgencia por
// tarjetas seleccionables (vía el genérico SelectorTarjetas, compartido con EstadoObjetoSelector
// desde 2026-07-23). Solo cambia la presentación — el valor emitido sigue siendo el mismo Urgencia
// ('BAJA' | 'MEDIA' | 'ALTA') que ya consume useCrearSolicitud/backend.
const OPCIONES: OpcionTarjeta[] = [
  { valor: 'BAJA', etiqueta: 'Baja', descripcion: 'Puede esperar algunas semanas', icono: '🕓' },
  { valor: 'MEDIA', etiqueta: 'Media', descripcion: 'Me gustaría recibirlo pronto', icono: '⏳' },
  { valor: 'ALTA', etiqueta: 'Alta', descripcion: 'Es muy urgente, lo necesito ya', icono: '🔥' },
];

interface UrgenciaSelectorProps {
  value: Urgencia;
  onChange: (valor: Urgencia) => void;
}

export function UrgenciaSelector({ value, onChange }: UrgenciaSelectorProps): JSX.Element {
  return <SelectorTarjetas label="Urgencia" opciones={OPCIONES} value={value} onChange={(v) => onChange(v as Urgencia)} />;
}
