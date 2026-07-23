const CONSEJOS = [
  'Coordina siempre mediante DonaConnect.',
  'No compartas contraseñas ni datos bancarios.',
  'Verifica el estado del artículo al recibirlo.',
  'Reporta comportamientos sospechosos.',
];

// Rediseño de DonacionDetallePage (2026-07-23) — tarjeta puramente informativa; no reemplaza ni
// implementa lógica de reportes (no existe endpoint de reportes en este proyecto).
export function SafetyTips(): JSX.Element {
  return (
    <div className="tarjeta donacion-seccion">
      <h3>Consejos de seguridad</h3>
      <ul className="consejos-lista">
        {CONSEJOS.map((consejo) => (
          <li key={consejo}>
            <span aria-hidden="true">✅</span> {consejo}
          </li>
        ))}
      </ul>
    </div>
  );
}
