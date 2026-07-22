import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useActualizarPerfiles } from '@features/identidad/hooks/useActualizarPerfiles';
import { useActualizarUbicacion } from '@features/identidad/hooks/useActualizarUbicacion';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { Button } from '@shared/components/atoms/Button';
import { Avatar } from '@shared/components/atoms/Avatar';
import { LocationPicker } from '@shared/components/molecules/LocationPicker';
import type { UbicacionInput } from '@shared/lib/ubicacion';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

const UBICACION_VACIA: UbicacionInput = { provincia: '', ciudad: '' };

// Fase 5, sección 1: "Ubicación" vive como tab dentro de /perfil, no como ítem de nav propio.
type Tab = 'cuenta' | 'ubicacion';

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — mismo catálogo que RegistroForm.
// COMUNIDAD removido (ADR-049) — separado hasta que se priorice como agregado `Organizacion`.
const PERFILES: { valor: PerfilFuncional; etiqueta: string }[] = [
  { valor: 'DONANTE', etiqueta: 'Donante — quiero donar objetos' },
  { valor: 'SOLICITANTE', etiqueta: 'Solicitante — necesito pedir ayuda' },
  { valor: 'TRUEQUE', etiqueta: 'Trueque — quiero intercambiar objetos' },
];

export function PerfilPage(): JSX.Element {
  const sesion = useSesion();
  const [tab, setTab] = useState<Tab>('cuenta');
  const [perfilesSeleccionados, setPerfilesSeleccionados] = useState<PerfilFuncional[]>([]);
  const [ubicacion, setUbicacion] = useState<UbicacionInput>(UBICACION_VACIA);
  const actualizarPerfiles = useActualizarPerfiles();
  const actualizarUbicacion = useActualizarUbicacion();
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (sesion.data) setPerfilesSeleccionados(sesion.data.perfiles);
  }, [sesion.data]);

  useEffect(() => {
    if (sesion.data?.ubicacion) setUbicacion(sesion.data.ubicacion);
  }, [sesion.data]);

  if (sesion.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (!sesion.data) return <p className="estado-lista">No se pudo cargar tu perfil.</p>;

  const usuario = sesion.data;

  function alternarPerfil(perfil: PerfilFuncional): void {
    setPerfilesSeleccionados((actuales) =>
      actuales.includes(perfil) ? actuales.filter((p) => p !== perfil) : [...actuales, perfil],
    );
  }

  async function guardarPerfiles(): Promise<void> {
    try {
      await actualizarPerfiles.mutateAsync({ perfiles: perfilesSeleccionados });
      mostrarToast('Perfiles actualizados.', 'exito');
    } catch {
      mostrarToast('No se pudieron actualizar los perfiles.', 'error');
    }
  }

  async function guardarUbicacion(): Promise<void> {
    try {
      await actualizarUbicacion.mutateAsync(ubicacion);
      mostrarToast('Ubicación de perfil guardada.', 'exito');
    } catch {
      mostrarToast('No se pudo guardar la ubicación.', 'error');
    }
  }

  return (
    <div className="perfil-pagina">
      <div className="perfil-encabezado">
        <Avatar nombre={usuario.nombre} />
        <div>
          <h1>{usuario.nombre}</h1>
          <p className="perfil-encabezado__correo">{usuario.correo}</p>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones de perfil" className="tabs">
        <button
          type="button"
          role="tab"
          className="tabs__item"
          aria-selected={tab === 'cuenta'}
          onClick={() => setTab('cuenta')}
        >
          Cuenta
        </button>
        <button
          type="button"
          role="tab"
          className="tabs__item"
          aria-selected={tab === 'ubicacion'}
          onClick={() => setTab('ubicacion')}
        >
          Ubicación
        </button>
      </div>

      {tab === 'cuenta' ? (
        <div className="tarjeta">
          <dl className="lista-datos">
            <div className="lista-datos__fila">
              <dt>Teléfono</dt>
              <dd>{usuario.telefono ?? 'No registrado'}</dd>
            </div>
            <div className="lista-datos__fila">
              <dt>Rol</dt>
              <dd>{usuario.rol}</dd>
            </div>
            <div className="lista-datos__fila">
              <dt>Miembro desde</dt>
              <dd>{new Date(usuario.fechaCreacion).toLocaleDateString('es-EC')}</dd>
            </div>
          </dl>

          <p>
            <Link to="/publicaciones/mias">📜 Mis publicaciones</Link>
          </p>
          {/* Acceso al panel de administración oculto de la nav principal (ADR-020) — solo visible aquí. */}
          {usuario.rol === 'ADMINISTRADOR' ? (
            <p>
              <Link to="/admin">⚙️ Panel de administración</Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — activar/desactivar perfiles propios. */}
      {tab === 'cuenta' ? (
        <fieldset className="form-field form-field--opciones tarjeta">
          <legend>Tus perfiles (qué puedes hacer en DonaConnect)</legend>
          {PERFILES.map((opcion) => (
            <label key={opcion.valor} className="opcion-checkbox">
              <input
                type="checkbox"
                checked={perfilesSeleccionados.includes(opcion.valor)}
                onChange={() => alternarPerfil(opcion.valor)}
              />
              {opcion.etiqueta}
            </label>
          ))}
          <Button type="button" onClick={guardarPerfiles} disabled={actualizarPerfiles.isPending}>
            {actualizarPerfiles.isPending ? 'Guardando…' : 'Guardar perfiles'}
          </Button>
        </fieldset>
      ) : null}

      {tab === 'ubicacion' ? (
        // PATCH /usuarios/me/ubicacion (cierra el gap que documentaba este mismo comentario antes).
        // Guardarla acá la deja disponible como "ubicación registrada" en los wizards de
        // Donación/Solicitud, en vez de tener que cargarla de cero en cada publicación.
        <div className="tarjeta">
          <p className="location-picker__ayuda">
            Guardá tu ubicación una vez y elegí reusarla al publicar una donación o solicitud.
          </p>
          <LocationPicker value={ubicacion} onChange={setUbicacion} />
          <Button
            type="button"
            onClick={guardarUbicacion}
            disabled={actualizarUbicacion.isPending || !ubicacion.provincia || !ubicacion.ciudad}
          >
            {actualizarUbicacion.isPending ? 'Guardando…' : 'Guardar ubicación'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
