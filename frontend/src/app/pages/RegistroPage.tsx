import { Link, useNavigate } from 'react-router-dom';
import { RegistroForm } from '@features/identidad/components/RegistroForm';

export function RegistroPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="pagina-angosta pagina-angosta--auth">
      <div className="auth-card">
        <div className="auth-card__encabezado">
          <span className="auth-card__marca">DonaConnect Ecuador</span>
          <h1>Crea tu cuenta</h1>
          <p className="auth-card__subtitulo">Únete a la comunidad — dona, pide ayuda o intercambia objetos.</p>
        </div>
        <RegistroForm onExito={() => navigate('/login')} />
        <p className="auth-card__pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
