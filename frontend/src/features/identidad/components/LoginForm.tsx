import { useState, type FormEvent } from 'react';
import { Input } from '@shared/components/atoms/Input';
import { Button } from '@shared/components/atoms/Button';
import { useLogin } from '../hooks/useLogin.js';

interface LoginFormProps {
  onExito: () => void;
}

export function LoginForm({ onExito }: LoginFormProps): JSX.Element {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  function manejarEnvio(evento: FormEvent): void {
    evento.preventDefault();
    login.mutate({ correo, password }, { onSuccess: onExito });
  }

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <Input
        label="Correo"
        name="correo"
        type="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {login.isError ? (
        <p role="alert" className="form-field__error">
          {login.error.message}
        </p>
      ) : null}
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
