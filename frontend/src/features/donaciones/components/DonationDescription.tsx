interface DonationDescriptionProps {
  descripcion: string;
}

// Rediseño de DonacionDetallePage (2026-07-23) — descripción completa (a diferencia del extracto de
// DonationSummaryCard), respetando saltos de línea reales del texto que escribió el donante.
export function DonationDescription({ descripcion }: DonationDescriptionProps): JSX.Element {
  const texto = descripcion.trim();
  return (
    <div className="tarjeta donacion-seccion">
      <h3>Descripción del artículo</h3>
      {texto ? (
        <p className="donacion-seccion__texto-libre">{texto}</p>
      ) : (
        <p className="donacion-seccion__vacio">El donante no agregó una descripción adicional.</p>
      )}
    </div>
  );
}
