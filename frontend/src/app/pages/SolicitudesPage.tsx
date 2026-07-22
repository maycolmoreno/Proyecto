import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useSolicitudes } from '@features/solicitudes/hooks/useSolicitudes';
import { OfertarRapido } from '@features/solicitudes/components/OfertarRapido';
import type { ListarSolicitudesFiltros } from '@features/solicitudes/types/index.js';
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

export function SolicitudesPage(): JSX.Element {
  const [filtros, setFiltros] = useState<ListarSolicitudesFiltros>({ page: 1, limit: 12 });
  const sesion = useSesion();
  const categorias = useCategorias();
  const solicitudes = useSolicitudes(filtros);

  const puedePublicar = sesion.data && PERFILES_PUEDEN_PUBLICAR.some((p) => sesion.data.perfiles.includes(p));

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

      <FiltroPanel
        definiciones={[
          {
            campo: 'categoriaId',
            etiqueta: 'Categoría',
            opciones: (categorias.data ?? []).map((c) => ({ valor: c.id, etiqueta: c.nombre })),
            variante: 'chips',
          },
          { campo: 'urgencia', etiqueta: 'Urgencia', opciones: OPCIONES_URGENCIA },
        ]}
        valores={filtros as Record<string, string>}
        onCambiar={cambiarFiltro}
      />

      {solicitudes.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {solicitudes.isError ? <p className="estado-lista">No se pudieron cargar las solicitudes.</p> : null}
      {solicitudes.data && solicitudes.data.data.length === 0 ? (
        <p className="estado-lista">Aún no hay solicitudes — sé el primero.</p>
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
                  <PublicacionCard
                    rutaDetalle={`/solicitudes/${solicitud.id}`}
                    titulo={solicitud.titulo}
                    estado={solicitud.estadoSolicitud}
                    urgencia={solicitud.urgencia}
                    ubicacion={`${solicitud.ubicacion.ciudad}, ${solicitud.ubicacion.provincia}`}
                  />
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
