import { Link } from 'react-router-dom';
import { useSesion, useCerrarSesion } from '@features/identidad/hooks/useSesion';
import { Button } from '@shared/components/atoms/Button';

export function HomePage(): JSX.Element {
  const sesion = useSesion();
  const cerrarSesion = useCerrarSesion();

  if (sesion.isLoading) {
    return <p>Cargando…</p>;
  }

  if (!sesion.data) {
    return (
      <main>
        <h1>DonaConnect Ecuador</h1>
        <p>
          <Link to="/login">Iniciar sesión</Link> · <Link to="/registro">Crear cuenta</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Bienvenido, {sesion.data.nombre}</h1>
      <p>Rol: {sesion.data.rol}</p>
      <Button variant="secundario" onClick={cerrarSesion}>
        Cerrar sesión
      </Button>
    </main>
  );
}
