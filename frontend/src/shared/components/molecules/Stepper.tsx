// Componente reutilizable (ADR-045): indicador de progreso de los 3 wizards de publicación
// (máx. 5 pasos, RNF-014). Rediseño visual 2026-07-23 (pedido del usuario, mismo tratamiento que
// SolicitudWizard) — stepper horizontal con círculos + etiquetas por paso en vez de la barra de
// puntos anterior. Cambia la forma de comunicar el prop (`etiquetas: string[]` en vez de un
// `etiqueta` del paso actual) porque ahora se muestran los 5 nombres a la vez, no solo el activo.
interface StepperProps {
  pasoActual: number;
  totalPasos: number;
  etiquetas: string[];
}

export function Stepper({ pasoActual, totalPasos, etiquetas }: StepperProps): JSX.Element {
  return (
    <div className="wizard-stepper" role="progressbar" aria-valuenow={pasoActual} aria-valuemin={1} aria-valuemax={totalPasos}>
      <p className="wizard-stepper__contador">
        Paso {pasoActual} de {totalPasos}
      </p>
      <ol className="wizard-stepper__lista">
        {etiquetas.map((etiqueta, i) => {
          const numero = i + 1;
          const estado = numero < pasoActual ? 'completado' : numero === pasoActual ? 'actual' : 'pendiente';
          return (
            <li key={etiqueta} className={`wizard-stepper__paso wizard-stepper__paso--${estado}`}>
              <span className="wizard-stepper__circulo" aria-hidden="true">
                {estado === 'completado' ? '✓' : numero}
              </span>
              <span className="wizard-stepper__etiqueta">{etiqueta}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
