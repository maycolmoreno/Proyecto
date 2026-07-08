import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@features/identidad/components/LoginForm';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main>
      <h1>Iniciar sesión</h1>
      <LoginForm onExito={() => navigate('/')} />
    </main>
  );
}
