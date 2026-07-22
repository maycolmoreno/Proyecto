import { useState, type FormEvent } from 'react';
import { Input } from '@shared/components/atoms/Input';
import { Button } from '@shared/components/atoms/Button';
import { useRegistro } from '../hooks/useRegistro.js';
import type { PerfilFuncional } from '../types/index.js';

interface RegistroFormProps {
  onExito: () => void;
}

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — selección múltiple, reemplaza el único
// <select> de rol: un usuario puede activar cualquier combinación de perfiles desde el registro.
// COMUNIDAD removido (ADR-049) — separado hasta que se priorice como agregado `Organizacion`.
const PERFILES: { valor: PerfilFuncional; etiqueta: string }[] = [
  { valor: 'DONANTE', etiqueta: 'Donante — quiero donar objetos' },
  { valor: 'SOLICITANTE', etiqueta: 'Solicitante — necesito pedir ayuda' },
  { valor: 'TRUEQUE', etiqueta: 'Trueque — quiero intercambiar objetos' },
];

export function RegistroForm({ onExito }: RegistroFormProps): JSX.Element {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [perfiles, setPerfiles] = useState<PerfilFuncional[]>(['DONANTE']);
  const registro = useRegistro();

  function alternarPerfil(perfil: PerfilFuncional): void {
    setPerfiles((actuales) =>
      actuales.includes(perfil) ? actuales.filter((p) => p !== perfil) : [...actuales, perfil],
    );
  }

  function manejarEnvio(evento: FormEvent): void {
    evento.preventDefault();
    if (perfiles.length === 0) return;
    registro.mutate(
      { nombre, correo, password, perfiles, aceptaTerminos: true },
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
      <fieldset className="form-field form-field--opciones">
        <legend>¿Qué quieres hacer en DonaConnect? (elige al menos una)</legend>
        {PERFILES.map((opcion) => (
          <label key={opcion.valor} className="opcion-checkbox">
            <input
              type="checkbox"
              checked={perfiles.includes(opcion.valor)}
              onChange={() => alternarPerfil(opcion.valor)}
            />
            {opcion.etiqueta}
          </label>
        ))}
      </fieldset>
      {perfiles.length === 0 ? (
        <p role="alert" className="form-field__error">
          Elige al menos un perfil.
        </p>
      ) : null}
      {registro.isError ? (
        <p role="alert" className="form-field__error">
          {registro.error.message}
        </p>
      ) : null}
      <Button type="submit" disabled={registro.isPending || perfiles.length === 0}>
        {registro.isPending ? 'Registrando…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
