import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useSolicitudes } from '@features/solicitudes/hooks/useSolicitudes';
import type { ListarSolicitudesFiltros } from '@features/solicitudes/types/index.js';

const ROLES_PUEDEN_PUBLICAR = ['BENEFICIARIO', 'USUARIO_COMUNIDAD'];
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

  const puedePublicar = sesion.data && ROLES_PUEDEN_PUBLICAR.includes(sesion.data.rol);

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
            {solicitudes.data.data.map((solicitud) => (
              <PublicacionCard
                key={solicitud.id}
                rutaDetalle={`/solicitudes/${solicitud.id}`}
                titulo={solicitud.titulo}
                estado={solicitud.estadoSolicitud}
                urgencia={solicitud.urgencia}
                ubicacion={`${solicitud.ubicacion.ciudad}, ${solicitud.ubicacion.provincia}`}
              />
            ))}
          </div>
          <div className="wizard__acciones">
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
