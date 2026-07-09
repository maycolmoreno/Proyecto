// Componente reutilizable (ADR-045): foto si existe, iniciales del nombre si no.
interface AvatarProps {
  nombre: string;
  fotoUrl?: string | null;
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const primera = partes[0]?.[0] ?? '';
  const segunda = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primera + segunda).toUpperCase();
}

export function Avatar({ nombre, fotoUrl }: AvatarProps): JSX.Element {
  return (
    <span className="avatar" role="img" aria-label={nombre}>
      {fotoUrl ? <img src={fotoUrl} alt="" /> : iniciales(nombre)}
    </span>
  );
}
