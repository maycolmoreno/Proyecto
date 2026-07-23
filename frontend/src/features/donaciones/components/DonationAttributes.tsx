interface DonationAttributesProps {
  itemsIncluidos: string[];
}

// Rediseño de DonacionDetallePage (2026-07-23) — "Sobre el artículo". El modelo de Donación
// (backend/domain/donaciones) no tiene marca, presentación, fecha de caducidad ni estado de
// empaque — esos campos del mockup de referencia no existen en el dominio real, así que no se
// muestran (no simular datos). El único atributo adicional real más allá de categoría/condición
// (ya destacadas en DonationSummaryCard) es itemsIncluidos, capturado en el paso 2 del wizard
// ("¿Qué incluye?").
export function DonationAttributes({ itemsIncluidos }: DonationAttributesProps): JSX.Element {
  return (
    <div className="tarjeta donacion-seccion">
      <h3>Sobre el artículo</h3>
      {itemsIncluidos.length > 0 ? (
        <ul className="donacion-seccion__lista-atributos">
          {itemsIncluidos.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="donacion-seccion__vacio">El donante no agregó atributos adicionales para este artículo.</p>
      )}
    </div>
  );
}
