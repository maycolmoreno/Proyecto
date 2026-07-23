import type { UbicacionRetiro } from '../types/index.js';

interface DeliveryDetailsProps {
  requiereRetiro: boolean;
  ubicacionRetiro: UbicacionRetiro | null;
}

// Rediseño de DonacionDetallePage (2026-07-23) — "Detalles de entrega". El backend no modela
// horario disponible, fecha disponible ni indicaciones adicionales para Donación (ni en
// UbicacionRetiro ni en Donacion) — esos campos del mockup de referencia no existen en el dominio
// real, así que no se muestran. `referencia` solo llega cuando el backend decide exponer la
// ubicación exacta (dueño/admin — ADR-019, ObtenerDonacionUseCase); para cualquier otro usuario el
// campo simplemente no viene en la respuesta, así que la fila se omite sola.
export function DeliveryDetails({ requiereRetiro, ubicacionRetiro }: DeliveryDetailsProps): JSX.Element {
  return (
    <div className="tarjeta donacion-seccion">
      <h3>Detalles de entrega</h3>
      <dl className="donacion-entrega-ficha">
        <div className="donacion-entrega-ficha__fila">
          <dt>Modalidad</dt>
          <dd>{requiereRetiro ? 'Retiro en la ubicación indicada' : 'Se coordina la entrega por chat'}</dd>
        </div>
        {ubicacionRetiro ? (
          <>
            <div className="donacion-entrega-ficha__fila">
              <dt>Provincia</dt>
              <dd>{ubicacionRetiro.provincia}</dd>
            </div>
            <div className="donacion-entrega-ficha__fila">
              <dt>Ciudad</dt>
              <dd>{ubicacionRetiro.ciudad}</dd>
            </div>
            {ubicacionRetiro.sector ? (
              <div className="donacion-entrega-ficha__fila">
                <dt>Sector</dt>
                <dd>{ubicacionRetiro.sector}</dd>
              </div>
            ) : null}
            {ubicacionRetiro.referencia ? (
              <div className="donacion-entrega-ficha__fila">
                <dt>Referencia</dt>
                <dd>{ubicacionRetiro.referencia}</dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>
    </div>
  );
}
