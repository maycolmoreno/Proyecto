import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { EstadoVacio } from '@shared/components/molecules/EstadoVacio';
import { PROVINCIAS_ECUADOR } from '@shared/lib/ubicacion';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useSolicitudes } from '@features/solicitudes/hooks/useSolicitudes';
import { OfertarRapido } from '@features/solicitudes/components/OfertarRapido';
import { SolicitudCard } from '@features/solicitudes/components/SolicitudCard';
import type { EstadoSolicitud, ListarSolicitudesFiltros } from '@features/solicitudes/types/index.js';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — antes ROLES_PUEDEN_PUBLICAR con rol.
// COMUNIDAD removido (ADR-049).
const PERFILES_PUEDEN_PUBLICAR: PerfilFuncional[] = ['SOLICITANTE'];
// Mismo criterio que SolicitudDetallePage.tsx (PERFILES_PUEDEN_OFERTAR) — repetido acá porque
// la acción rápida vive en esta página, no en un componente compartido.
const PERFILES_PUEDEN_OFERTAR: PerfilFuncional[] = ['DONANTE'];
const OPCIONES_URGENCIA = [
  { valor: 'ALTA', etiqueta: 'Alta' },
  { valor: 'MEDIA', etiqueta: 'Media' },
  { valor: 'BAJA', etiqueta: 'Baja' },
];
// Las 6 vigentes de EstadoSolicitud (backend/domain/solicitudes/value-objects/EstadoSolicitud.ts)
// con etiqueta legible — el badge de la tarjeta muestra el valor crudo, pero para tabs de
// navegación hace falta texto en español.
const TABS_ESTADO: { valor: EstadoSolicitud; etiqueta: string }[] = [
  { valor: 'ABIERTA', etiqueta: 'Abiertas' },
  { valor: 'EN_REVISION', etiqueta: 'En revisión' },
  { valor: 'ACEPTADA_POR_DONANTE', etiqueta: 'Aceptadas' },
  { valor: 'EN_ENTREGA', etiqueta: 'En entrega' },
  { valor: 'ATENDIDA', etiqueta: 'Atendidas' },
  { valor: 'CANCELADA', etiqueta: 'Canceladas' },
];
const OPCIONES_PROVINCIA = PROVINCIAS_ECUADOR.map((p) => ({ valor: p, etiqueta: p }));
const OPCIONES_ORDEN = [
  { valor: 'fecha_desc', etiqueta: 'Más recientes' },
  { valor: 'fecha_asc', etiqueta: 'Más antiguas' },
];

export function SolicitudesPage(): JSX.Element {
  const [filtros, setFiltros] = useState<ListarSolicitudesFiltros>({ page: 1, limit: 12 });
  const sesion = useSesion();
  const categorias = useCategorias();
  const solicitudes = useSolicitudes(filtros);

  const puedePublicar = sesion.data && PERFILES_PUEDEN_PUBLICAR.some((p) => sesion.data.perfiles.includes(p));
  const hayFiltrosActivos = Object.entries(filtros).some(
    ([campo, valor]) => campo !== 'page' && campo !== 'limit' && campo !== 'sort' && Boolean(valor),
  );

  function cambiarFiltro(campo: string, valor: string): void {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor || undefined, page: 1 }));
  }

  return (
    <div>
      <div className="pagina-encabezado">
        <h1>Solicitudes</h1>
        {puedePublicar ? (
          <Link to="/solicitudes/nueva">
            <Button type="button">+ Publicar</Button>
          </Link>
        ) : null}
      </div>

      {/* Tabs de estado — separadas del panel de filtros porque son la navegación principal del
          listado (RF-016), no un filtro secundario como categoría/urgencia/ubicación. */}
      <div className="chips" role="group" aria-label="Estado">
        <button
          type="button"
          className={`chip ${!filtros.estado ? 'chip--activo' : ''}`}
          onClick={() => cambiarFiltro('estado', '')}
        >
          Todas
        </button>
        {TABS_ESTADO.map((tab) => (
          <button
            key={tab.valor}
            type="button"
            className={`chip ${filtros.estado === tab.valor ? 'chip--activo' : ''}`}
            onClick={() => cambiarFiltro('estado', tab.valor)}
          >
            {tab.etiqueta}
          </button>
        ))}
      </div>

      <FiltroPanel
        definiciones={[
          {
            campo: 'categoriaId',
            etiqueta: 'Categoría',
            opciones: (categorias.data ?? []).map((c) => ({ valor: c.id, etiqueta: c.nombre })),
            variante: 'chips',
          },
          { campo: 'urgencia', etiqueta: 'Urgencia', opciones: OPCIONES_URGENCIA },
          { campo: 'provincia', etiqueta: 'Provincia', opciones: OPCIONES_PROVINCIA },
          { campo: 'ciudad', etiqueta: 'Ciudad', variante: 'texto' },
          { campo: 'sort', etiqueta: 'Ordenar por', opciones: OPCIONES_ORDEN },
        ]}
        valores={filtros as Record<string, string>}
        onCambiar={cambiarFiltro}
      />

      {solicitudes.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {solicitudes.isError ? <p className="estado-lista">No se pudieron cargar las solicitudes.</p> : null}
      {solicitudes.data && solicitudes.data.data.length === 0 ? (
        hayFiltrosActivos ? (
          <EstadoVacio
            icono="🔍"
            titulo="Ninguna solicitud coincide con estos filtros"
            descripcion="Prueba con otra categoría, urgencia o ubicación."
            accion={{ texto: 'Limpiar filtros', onClick: () => setFiltros({ page: 1, limit: 12 }) }}
          />
        ) : (
          <EstadoVacio
            icono="🙏"
            titulo="Aún no hay solicitudes publicadas"
            descripcion={puedePublicar ? 'Sé la primera persona en pedir ayuda a la comunidad.' : undefined}
            accion={puedePublicar ? { texto: '+ Publicar solicitud', to: '/solicitudes/nueva' } : undefined}
          />
        )
      ) : null}

      {solicitudes.data && solicitudes.data.data.length > 0 ? (
        <>
          <div className="grid-publicaciones">
            {solicitudes.data.data.map((solicitud) => {
              const puedeOfertar =
                sesion.data &&
                sesion.data.id !== solicitud.beneficiarioId &&
                PERFILES_PUEDEN_OFERTAR.some((p) => sesion.data.perfiles.includes(p)) &&
                solicitud.estadoSolicitud === 'ABIERTA';
              return (
                <div key={solicitud.id} className="publicacion-card-envoltorio">
                  <SolicitudCard solicitud={solicitud} />
                  {puedeOfertar ? (
                    <OfertarRapido solicitudId={solicitud.id} categoriaId={solicitud.categoria.id} />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="fila-acciones">
            <Button
              type="button"
              variant="secundario"
              disabled={(filtros.page ?? 1) <= 1}
              onClick={() => setFiltros((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              « Anterior
            </Button>
            <span>
              Página {solicitudes.data.meta.page} de {solicitudes.data.meta.totalPages || 1}
            </span>
            <Button
              type="button"
              variant="secundario"
              disabled={(filtros.page ?? 1) >= solicitudes.data.meta.totalPages}
              onClick={() => setFiltros((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Siguiente »
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
