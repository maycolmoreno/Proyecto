import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { EstadoVacio } from '@shared/components/molecules/EstadoVacio';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useTrueques } from '@features/trueques/hooks/useTrueques';
import { TruequeCard } from '@features/trueques/components/TruequeCard';
import type { EstadoTrueque, ListarTruequesFiltros } from '@features/trueques/types/index.js';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — antes ROLES_PUEDEN_PUBLICAR con rol.
// COMUNIDAD removido (ADR-049).
const PERFILES_PUEDEN_PUBLICAR: PerfilFuncional[] = ['TRUEQUE'];
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
        <div className="pagina-encabezado__texto">
          <span className="pagina-encabezado__eyebrow">Intercambio responsable</span>
          <h1>Trueques</h1>
          <p>Intercambia lo que ya no usas por algo que sí necesitas.</p>
        </div>
        {puedePublicar ? (
          <Link to="/trueques/nuevo" className="btn btn--primario">
            Publicar trueque
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
          { campo: 'estado', etiqueta: 'Estado', opciones: OPCIONES_ESTADO.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta })) },
        ]}
        valores={filtros as Record<string, string>}
        onCambiar={cambiarFiltro}
      />

      {trueques.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {trueques.isError ? <p className="estado-lista">No se pudieron cargar los trueques.</p> : null}
      {trueques.data && trueques.data.data.length === 0 ? (
        hayFiltrosActivos ? (
          <EstadoVacio
            icono="🔍"
            titulo="Ningún trueque coincide con estos filtros"
            descripcion="Prueba con otra categoría o estado."
            accion={{ texto: 'Limpiar filtros', onClick: () => setFiltros({ page: 1, limit: 12 }) }}
          />
        ) : (
          <EstadoVacio
            icono="🔄"
            titulo="Aún no hay trueques publicados"
            descripcion={puedePublicar ? 'Sé la primera persona en proponer un trueque.' : undefined}
            accion={puedePublicar ? { texto: '+ Publicar trueque', to: '/trueques/nuevo' } : undefined}
          />
        )
      ) : null}

      {trueques.data && trueques.data.data.length > 0 ? (
        <>
          <div className="grid-publicaciones">
            {trueques.data.data.map((trueque) => (
              <TruequeCard key={trueque.id} trueque={trueque} />
            ))}
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
