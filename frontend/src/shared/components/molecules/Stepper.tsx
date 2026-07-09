// Componente reutilizable (ADR-045): indicador de progreso genérico para los 3 wizards de
// publicación (máx. 5 pasos, RNF-014). Fase 5, sección 2.4.
interface StepperProps {
  pasoActual: number;
  totalPasos: number;
  etiqueta: string;
}

export function Stepper({ pasoActual, totalPasos, etiqueta }: StepperProps): JSX.Element {
  return (
    <div className="stepper" role="progressbar" aria-valuenow={pasoActual} aria-valuemin={1} aria-valuemax={totalPasos}>
      <div className="stepper__puntos">
        {Array.from({ length: totalPasos }, (_, i) => i + 1).map((paso) => (
          <span key={paso} className={`stepper__punto${paso <= pasoActual ? ' stepper__punto--activo' : ''}`} />
        ))}
      </div>
      <p className="stepper__texto">
        Paso {pasoActual} de {totalPasos} — {etiqueta}
      </p>
    </div>
  );
}
