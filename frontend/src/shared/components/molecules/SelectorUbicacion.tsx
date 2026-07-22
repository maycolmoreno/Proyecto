import { useState } from 'react';
import { LocationPicker } from './LocationPicker';
import type { UbicacionInput } from '@shared/lib/ubicacion';

interface SelectorUbicacionProps {
  value: UbicacionInput;
  onChange: (value: UbicacionInput) => void;
  /** Ubicación guardada en el perfil del usuario (PATCH /usuarios/me/ubicacion), o `null` si nunca
   * la configuró. Componente controlado y agnóstico de dominio (ADR-045) — no sabe si lo está
   * usando un wizard de Donación, Solicitud o la propia página de perfil. */
  ubicacionRegistrada: UbicacionInput | null;
}

// Envuelve LocationPicker agregando la opción de reusar la ubicación ya guardada en el perfil, en
// vez de pedirla de cero en cada publicación. Sin ubicación registrada, se comporta exactamente
// como LocationPicker solo (sin el toggle) — no cambia nada para quien no usó el feature nuevo.
export function SelectorUbicacion({ value, onChange, ubicacionRegistrada }: SelectorUbicacionProps): JSX.Element {
  const [usarRegistrada, setUsarRegistrada] = useState(Boolean(ubicacionRegistrada));

  if (!ubicacionRegistrada) {
    return <LocationPicker value={value} onChange={onChange} />;
  }

  function elegirRegistrada(): void {
    setUsarRegistrada(true);
    onChange(ubicacionRegistrada!);
  }

  return (
    <div className="selector-ubicacion">
      <div className="selector-ubicacion__opciones">
        <label className="opcion-checkbox">
          <input type="radio" name="origen-ubicacion" checked={usarRegistrada} onChange={elegirRegistrada} />
          Usar mi ubicación registrada — {ubicacionRegistrada.ciudad}, {ubicacionRegistrada.provincia}
        </label>
        <label className="opcion-checkbox">
          <input type="radio" name="origen-ubicacion" checked={!usarRegistrada} onChange={() => setUsarRegistrada(false)} />
          Ingresar una nueva ubicación
        </label>
      </div>
      {!usarRegistrada ? <LocationPicker value={value} onChange={onChange} /> : null}
    </div>
  );
}
