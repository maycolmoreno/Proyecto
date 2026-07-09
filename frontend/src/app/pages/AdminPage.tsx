import { useState } from 'react';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { Select } from '@shared/components/atoms/Select';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useDonaciones } from '@features/donaciones/hooks/useDonaciones';
import { useSolicitudes } from '@features/solicitudes/hooks/useSolicitudes';
import { useTrueques } from '@features/trueques/hooks/useTrueques';
import { useUsuariosAdmin } from '@features/administracion/hooks/useUsuariosAdmin';
import { useModerarUsuario } from '@features/administracion/hooks/useModerarUsuario';
import { useModerarPublicacion } from '@features/administracion/hooks/useModerarPublicacion';
import { useReportes } from '@features/administracion/hooks/useReportes';
import type { AccionModeracion, TipoEntidadModeracion, RolUsuario, EstadoUsuario } from '@features/administracion/types/index.js';

type TabPrincipal = 'usuarios' | 'publicaciones' | 'reportes';
type TipoPublicacion = 'DONACION' | 'SOLICITUD' | 'TRUEQUE';

const ROLES: RolUsuario[] = ['ADMINISTRADOR', 'DONANTE', 'BENEFICIARIO', 'USUARIO_COMUNIDAD'];
const ESTADOS_USUARIO: EstadoUsuario[] = ['ACTIVO', 'SUSPENDIDO', 'ELIMINADO'];

// Fase 5, sección 2.7 — tabs Usuarios/Publicaciones/Reportes, solo ADMINISTRADOR (ADR-020, sin
// ítem propio en la nav principal, acceso vía menú de perfil).
export function AdminPage(): JSX.Element {
  const [tab, setTab] = useState<TabPrincipal>('publicaciones');
  const sesion = useSesion();

  // RutaProtegida solo exige sesión activa (cualquier rol) — el guard de rol vive aquí, mismo
  // patrón que las validaciones de dueño en las páginas de detalle (ADR-020).
  if (sesion.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (sesion.data?.rol !== 'ADMINISTRADOR') {
    return <p className="estado-lista">No tienes permiso para ver esta página.</p>;
  }

  return (
    <div>
      <h1>Administración</h1>
      <div role="tablist" aria-label="Secciones de administración">
        <button type="button" role="tab" aria-selected={tab === 'usuarios'} onClick={() => setTab('usuarios')}>
          Usuarios
        </button>
        <button type="button" role="tab" aria-selected={tab === 'publicaciones'} onClick={() => setTab('publicaciones')}>
          Publicaciones
        </button>
        <button type="button" role="tab" aria-selected={tab === 'reportes'} onClick={() => setTab('reportes')}>
          Reportes
        </button>
      </div>

      {tab === 'usuarios' ? <TabUsuarios /> : null}
      {tab === 'publicaciones' ? <TabPublicaciones /> : null}
      {tab === 'reportes' ? <TabReportes /> : null}
    </div>
  );
}

function TabUsuarios(): JSX.Element {
  const [rol, setRol] = useState<RolUsuario | ''>('');
  const [estado, setEstado] = useState<EstadoUsuario | ''>('');
  const usuarios = useUsuariosAdmin({
    page: 1,
    limit: 50,
    rol: rol || undefined,
    estado: estado || undefined,
  });
  const moderarUsuario = useModerarUsuario();
  const { mostrarToast } = useToast();

  async function moderar(id: string, accion: AccionModeracion): Promise<void> {
    try {
      await moderarUsuario.mutateAsync({ id, accion });
      mostrarToast('Usuario actualizado.', 'exito');
    } catch {
      mostrarToast('No se pudo actualizar el usuario.', 'error');
    }
  }

  return (
    <div>
      <div className="filtro-panel">
        <Select
          label="Rol"
          name="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as RolUsuario | '')}
          opciones={ROLES.map((r) => ({ valor: r, etiqueta: r }))}
          placeholder="Todos"
        />
        <Select
          label="Estado"
          name="estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoUsuario | '')}
          opciones={ESTADOS_USUARIO.map((e) => ({ valor: e, etiqueta: e }))}
          placeholder="Todos"
        />
      </div>

      {usuarios.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {usuarios.data && usuarios.data.data.length === 0 ? <p className="estado-lista">No hay usuarios.</p> : null}

      {(usuarios.data?.data ?? []).map((usuario) => (
        <div key={usuario.id} className="oferta-item">
          <p>
            <strong>{usuario.nombre}</strong> — {usuario.correo} ({usuario.rol})
          </p>
          <StatusBadge estado={usuario.estado} />
          <Button onClick={() => moderar(usuario.id, 'APROBAR')} disabled={moderarUsuario.isPending}>
            Activar
          </Button>
          <Button variant="secundario" onClick={() => moderar(usuario.id, 'BLOQUEAR')} disabled={moderarUsuario.isPending}>
            Suspender
          </Button>
          <Button variant="peligro" onClick={() => moderar(usuario.id, 'ELIMINAR')} disabled={moderarUsuario.isPending}>
            Eliminar
          </Button>
        </div>
      ))}
    </div>
  );
}

function TabPublicaciones(): JSX.Element {
  const [tipo, setTipo] = useState<TipoPublicacion>('DONACION');
  const donaciones = useDonaciones({ page: 1, limit: 50 });
  const solicitudes = useSolicitudes({ page: 1, limit: 50 });
  const trueques = useTrueques({ page: 1, limit: 50 });
  const moderarPublicacion = useModerarPublicacion();
  const { mostrarToast } = useToast();

  async function moderar(id: string, accion: AccionModeracion): Promise<void> {
    try {
      await moderarPublicacion.mutateAsync({ tipo: tipo as TipoEntidadModeracion, id, accion });
      mostrarToast('Publicación actualizada.', 'exito');
    } catch {
      mostrarToast('No se pudo actualizar la publicación.', 'error');
    }
  }

  const listaActual =
    tipo === 'DONACION'
      ? (donaciones.data?.data ?? []).map((d) => ({ id: d.id, titulo: d.titulo, estado: d.estadoDonacion }))
      : tipo === 'SOLICITUD'
        ? (solicitudes.data?.data ?? []).map((s) => ({ id: s.id, titulo: s.titulo, estado: s.estadoSolicitud }))
        : (trueques.data?.data ?? []).map((t) => ({ id: t.id, titulo: t.titulo, estado: t.estadoTrueque }));

  return (
    <div>
      <div role="tablist" aria-label="Tipo de publicación">
        <button type="button" role="tab" aria-selected={tipo === 'DONACION'} onClick={() => setTipo('DONACION')}>
          Donaciones
        </button>
        <button type="button" role="tab" aria-selected={tipo === 'SOLICITUD'} onClick={() => setTipo('SOLICITUD')}>
          Solicitudes
        </button>
        <button type="button" role="tab" aria-selected={tipo === 'TRUEQUE'} onClick={() => setTipo('TRUEQUE')}>
          Trueques
        </button>
      </div>

      {listaActual.length === 0 ? <p className="estado-lista">No hay publicaciones.</p> : null}

      {listaActual.map((item) => (
        <div key={item.id} className="oferta-item">
          <p>{item.titulo}</p>
          <StatusBadge estado={item.estado} />
          <Button onClick={() => moderar(item.id, 'APROBAR')} disabled={moderarPublicacion.isPending}>
            Aprobar
          </Button>
          <Button variant="secundario" onClick={() => moderar(item.id, 'BLOQUEAR')} disabled={moderarPublicacion.isPending}>
            Bloquear
          </Button>
          <Button variant="peligro" onClick={() => moderar(item.id, 'ELIMINAR')} disabled={moderarPublicacion.isPending}>
            Eliminar
          </Button>
        </div>
      ))}
    </div>
  );
}

function TabReportes(): JSX.Element {
  const reportes = useReportes();
  const moderarPublicacion = useModerarPublicacion();
  const { mostrarToast } = useToast();

  async function moderar(tipo: TipoEntidadModeracion, id: string, accion: AccionModeracion): Promise<void> {
    try {
      await moderarPublicacion.mutateAsync({ tipo, id, accion });
      mostrarToast('Publicación actualizada.', 'exito');
    } catch {
      mostrarToast('No se pudo actualizar la publicación.', 'error');
    }
  }

  if (reportes.isLoading) return <p className="estado-lista">Cargando…</p>;
  if (!reportes.data || reportes.data.length === 0) {
    return <p className="estado-lista">Sin publicaciones marcadas con riesgo por la IA.</p>;
  }

  return (
    <div>
      {reportes.data.map((reporte) => (
        <div key={`${reporte.tipoEntidad}-${reporte.entidadId}-${reporte.fecha}`} className="oferta-item">
          <p>
            <strong>{reporte.tipoEntidad}</strong> — {reporte.categoriaRiesgo} (confianza:{' '}
            {reporte.confianza !== null ? `${Math.round(reporte.confianza * 100)}%` : 'N/D'})
          </p>
          <p>{reporte.explicacion}</p>
          <Button onClick={() => moderar(reporte.tipoEntidad, reporte.entidadId, 'APROBAR')} disabled={moderarPublicacion.isPending}>
            Aprobar
          </Button>
          <Button
            variant="peligro"
            onClick={() => moderar(reporte.tipoEntidad, reporte.entidadId, 'BLOQUEAR')}
            disabled={moderarPublicacion.isPending}
          >
            Bloquear
          </Button>
        </div>
      ))}
    </div>
  );
}
