import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '@features/identidad/components/LoginForm';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="pagina-angosta pagina-angosta--auth">
      <div className="auth-card">
        <div className="auth-card__encabezado">
          <span className="auth-card__marca">DonaConnect Ecuador</span>
          <h1>Bienvenido de vuelta</h1>
          <p className="auth-card__subtitulo">Inicia sesión para donar, pedir ayuda o intercambiar con tu comunidad.</p>
        </div>
        <LoginForm onExito={() => navigate('/')} />
        <p className="auth-card__pie">
          ¿No tienes cuenta? <Link to="/registro">Crea una</Link>
        </p>
      </div>
    </main>
  );
}
