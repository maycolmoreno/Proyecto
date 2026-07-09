import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useTrueques } from '@features/trueques/hooks/useTrueques';
import type { EstadoTrueque, ListarTruequesFiltros } from '@features/trueques/types/index.js';

const ROLES_PUEDEN_PUBLICAR = ['DONANTE', 'USUARIO_COMUNIDAD'];
const OPCIONES_ESTADO: { valor: EstadoTrueque; etiqueta: string }[] = [
  { valor: 'PUBLICADO', etiqueta: 'Publicado' },
  { valor: 'PROPUESTA_RECIBIDA', etiqueta: 'Con propuestas' },
  { valor: 'EN_COORDINACION', etiqueta: 'En coordinación' },
  { valor: 'INTERCAMBIADO', etiqueta: 'Intercambiado' },
];

export function TruequesPage(): JSX.Element {
  const [filtros, setFiltros] = useState<ListarTruequesFiltros>({ page: 1, limit: 12 });
  const sesion = useSesion();
  const categorias = useCategorias();
  const trueques = useTrueques(filtros);

  const puedePublicar = sesion.data && ROLES_PUEDEN_PUBLICAR.includes(sesion.data.rol);

  function cambiarFiltro(campo: string, valor: string): void {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor || undefined, page: 1 }));
  }

  return (
    <div>
      <div className="pagina-encabezado">
        <h1>Trueques</h1>
        {puedePublicar ? (
          <Link to="/trueques/nuevo">
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
          { campo: 'estado', etiqueta: 'Estado', opciones: OPCIONES_ESTADO.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta })) },
        ]}
        valores={filtros as Record<string, string>}
        onCambiar={cambiarFiltro}
      />

      {trueques.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {trueques.isError ? <p className="estado-lista">No se pudieron cargar los trueques.</p> : null}
      {trueques.data && trueques.data.data.length === 0 ? (
        <p className="estado-lista">Aún no hay trueques publicados — sé el primero.</p>
      ) : null}

      {trueques.data && trueques.data.data.length > 0 ? (
        <>
          <div className="grid-publicaciones">
            {trueques.data.data.map((trueque) => (
              <PublicacionCard
                key={trueque.id}
                rutaDetalle={`/trueques/${trueque.id}`}
                titulo={trueque.titulo}
                imagenUrl={trueque.imagenes[0]}
                estado={trueque.estadoTrueque}
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
              Página {trueques.data.meta.page} de {trueques.data.meta.totalPages || 1}
            </span>
            <Button
              type="button"
              variant="secundario"
              disabled={(filtros.page ?? 1) >= trueques.data.meta.totalPages}
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
