import { useState, type FormEvent } from 'react';
import { Input } from '@shared/components/atoms/Input';
import { Button } from '@shared/components/atoms/Button';
import { useRegistro } from '../hooks/useRegistro.js';
import type { Rol } from '../types/index.js';

interface RegistroFormProps {
  onExito: () => void;
}

const ROLES: { valor: Rol; etiqueta: string }[] = [
  { valor: 'USUARIO_COMUNIDAD', etiqueta: 'Usuario Comunidad (dona, solicita e intercambia)' },
  { valor: 'DONANTE', etiqueta: 'Donante' },
  { valor: 'BENEFICIARIO', etiqueta: 'Beneficiario' },
];

export function RegistroForm({ onExito }: RegistroFormProps): JSX.Element {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('USUARIO_COMUNIDAD');
  const registro = useRegistro();

  function manejarEnvio(evento: FormEvent): void {
    evento.preventDefault();
    registro.mutate(
      { nombre, correo, password, rol, aceptaTerminos: true },
      { onSuccess: onExito },
    );
  }

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <Input label="Nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
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
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div className="form-field">
        <label htmlFor="rol">Rol</label>
        <select id="rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          {ROLES.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>
      {registro.isError ? (
        <p role="alert" className="form-field__error">
          {registro.error.message}
        </p>
      ) : null}
      <Button type="submit" disabled={registro.isPending}>
        {registro.isPending ? 'Registrando…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
