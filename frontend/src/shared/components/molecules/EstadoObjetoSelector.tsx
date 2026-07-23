import { SelectorTarjetas, type OpcionTarjeta } from './SelectorTarjetas';

// EstadoObjeto es el mismo value object en Donación y Trueque (ambos wizards comparten el catálogo
// NUEVO/BUEN_ESTADO/USADO/REQUIERE_REPARACION) — mismo criterio de centralización que ya usa
// etiquetaEstadoObjeto en shared/lib/estado-color.ts. Reemplaza el <select> tradicional por tarjetas
// (rediseño 2026-07-23, mismo tratamiento que UrgenciaSelector en Solicitud). No cambia el valor
// emitido: sigue siendo un EstadoObjeto crudo — el llamador hace el cast a su propio tipo local
// (Donación y Trueque cada uno declara su propio `EstadoObjeto` en features/*/types).
const OPCIONES: OpcionTarjeta[] = [
  { valor: 'NUEVO', etiqueta: 'Nuevo', descripcion: 'Sin uso, como recién comprado', icono: '🆕' },
  { valor: 'BUEN_ESTADO', etiqueta: 'Buen estado', descripcion: 'Con uso, pero cuidado y funcional', icono: '👍' },
  { valor: 'USADO', etiqueta: 'Usado', descripcion: 'Con signos de uso visibles', icono: '🔄' },
  { valor: 'REQUIERE_REPARACION', etiqueta: 'Requiere reparación', descripcion: 'Funciona parcialmente o necesita arreglo', icono: '🔧' },
];

interface EstadoObjetoSelectorProps {
  value: string;
  onChange: (valor: string) => void;
}

export function EstadoObjetoSelector({ value, onChange }: EstadoObjetoSelectorProps): JSX.Element {
  return <SelectorTarjetas label="Estado del objeto" opciones={OPCIONES} value={value} onChange={onChange} />;
}
