import { Link } from 'react-router-dom';
import { Avatar } from '@shared/components/atoms/Avatar';
import { Button } from '@shared/components/atoms/Button';
import { Icon } from '@shared/components/atoms/Icon';

// Componente reutilizable (ADR-045): barra superior en todas las pantallas (Fase 5, sección 2.1).
// No importa tipos de features/* — recibe solo lo mínimo que necesita mostrar, desacoplado de
// BC-Identidad (regla de reutilización, Fase 1 sección 9.3).
interface NavbarUsuario {
  nombre: string;
}

interface NavbarProps {
  usuario?: NavbarUsuario | null;
  onCerrarSesion?: () => void;
  contadorNotificaciones?: number;
  onClickCampana?: () => void;
}

export function Navbar({ usuario, onCerrarSesion, contadorNotificaciones, onClickCampana }: NavbarProps): JSX.Element {
  return (
    <header className="shell__navbar">
      <Link to="/" className="shell__navbar-marca">
        DonaConnect
      </Link>
      <div className="shell__navbar-acciones">
        {usuario ? (
          <>
            <button type="button" className="navbar__icono-boton" onClick={onClickCampana} aria-label="Notificaciones">
              <Icon name="bell" className="nav-icon" />
              {contadorNotificaciones ? <span className="badge-contador">{contadorNotificaciones}</span> : null}
            </button>
            <Link to="/conversaciones" className="navbar__icono-boton" aria-label="Mensajes">
              <Icon name="mail" className="nav-icon" />
            </Link>
            <Avatar nombre={usuario.nombre} />
            <Button variant="secundario" onClick={onCerrarSesion}>
              Salir
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/registro">Crear cuenta</Link>
          </>
        )}
      </div>
    </header>
  );
}
