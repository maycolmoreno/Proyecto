import { Input } from '@shared/components/atoms/Input';
import { Select } from '@shared/components/atoms/Select';
import { Button } from '@shared/components/atoms/Button';
import { PROVINCIAS_ECUADOR, type UbicacionInput } from '@shared/lib/ubicacion';

// Componente reutilizable (ADR-045): provincia/ciudad/sector/referencia + geolocalización opcional
// (IF-HW-002). Componente controlado — recibe value/onChange, no mantiene estado propio.
interface LocationPickerProps {
  value: UbicacionInput;
  onChange: (value: UbicacionInput) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps): JSX.Element {
  function actualizar<K extends keyof UbicacionInput>(campo: K, valor: UbicacionInput[K]): void {
    onChange({ ...value, [campo]: valor });
  }

  function usarMiUbicacion(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        onChange({ ...value, latitud: posicion.coords.latitude, longitud: posicion.coords.longitude });
      },
      () => undefined, // permiso denegado o error — silencioso, es un campo opcional (IF-HW-002)
    );
  }

  return (
    <div className="location-picker">
      <Select
        label="Provincia"
        name="provincia"
        value={value.provincia}
        onChange={(e) => actualizar('provincia', e.target.value)}
        opciones={PROVINCIAS_ECUADOR.map((p) => ({ valor: p, etiqueta: p }))}
        placeholder="Selecciona tu provincia"
        required
      />
      <Input
        label="Ciudad"
        name="ciudad"
        value={value.ciudad}
        onChange={(e) => actualizar('ciudad', e.target.value)}
        required
      />
      <Input
        label="Sector (opcional)"
        name="sector"
        value={value.sector ?? ''}
        onChange={(e) => actualizar('sector', e.target.value)}
      />
      <Input
        label="Referencia (opcional)"
        name="referencia"
        value={value.referencia ?? ''}
        onChange={(e) => actualizar('referencia', e.target.value)}
      />
      <Button type="button" variant="secundario" onClick={usarMiUbicacion}>
        📍 Usar mi ubicación actual
      </Button>
      {value.latitud && value.longitud ? <p>Coordenadas guardadas ✓</p> : null}
    </div>
  );
}
