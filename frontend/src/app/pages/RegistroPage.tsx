import { useNavigate } from 'react-router-dom';
import { RegistroForm } from '@features/identidad/components/RegistroForm';

export function RegistroPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="pagina-angosta">
      <h1>Crear cuenta</h1>
      <RegistroForm onExito={() => navigate('/login')} />
    </main>
  );
}
