import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@features/identidad/hooks/useSesion';

// Fase 5, sección 1: "Ubicación" vive como tab dentro de /perfil, no como ítem de nav propio.
type Tab = 'cuenta' | 'ubicacion';

export function PerfilPage(): JSX.Element {
  const sesion = useSesion();
  const [tab, setTab] = useState<Tab>('cuenta');

  if (sesion.isLoading) return <p>Cargando…</p>;
  if (!sesion.data) return <p>No se pudo cargar tu perfil.</p>;

  const usuario = sesion.data;

  return (
    <div>
      <h1>Perfil</h1>
      <div role="tablist" aria-label="Secciones de perfil">
        <button type="button" role="tab" aria-selected={tab === 'cuenta'} onClick={() => setTab('cuenta')}>
          Cuenta
        </button>
        <button type="button" role="tab" aria-selected={tab === 'ubicacion'} onClick={() => setTab('ubicacion')}>
          Ubicación
        </button>
      </div>

      {tab === 'cuenta' ? (
        <dl>
          <dt>Nombre</dt>
          <dd>{usuario.nombre}</dd>
          <dt>Correo</dt>
          <dd>{usuario.correo}</dd>
          <dt>Teléfono</dt>
          <dd>{usuario.telefono ?? 'No registrado'}</dd>
          <dt>Rol</dt>
          <dd>{usuario.rol}</dd>
          <dt>Miembro desde</dt>
          <dd>{new Date(usuario.fechaCreacion).toLocaleDateString('es-EC')}</dd>
        </dl>
      ) : null}

      {/* Acceso al panel de administración oculto de la nav principal (ADR-020) — solo visible aquí. */}
      {tab === 'cuenta' && usuario.rol === 'ADMINISTRADOR' ? (
        <p>
          <Link to="/admin">⚙️ Panel de administración</Link>
        </p>
      ) : null}

      {tab === 'ubicacion' ? (
        // El backend no expone todavía un endpoint de ubicación de perfil editable (Fase 4 solo
        // lista GET /usuarios/me para BC-Identidad) — gap documentado, no una funcionalidad inventada.
        <p>
          La ubicación de perfil se usa hoy solo al publicar (Donación/Solicitud/Trueque piden su
          propia ubicación en cada wizard). Un editor de ubicación de perfil independiente requiere
          un endpoint nuevo en el backend, fuera del alcance actual.
        </p>
      ) : null}
    </div>
  );
}
