import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { EstadoVacio } from '@shared/components/molecules/EstadoVacio';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useDonaciones } from '@features/donaciones/hooks/useDonaciones';
import { DonacionCard } from '@features/donaciones/components/DonacionCard';
import type { EstadoDonacion, ListarDonacionesFiltros } from '@features/donaciones/types/index.js';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — antes ROLES_PUEDEN_PUBLICAR con rol.
// COMUNIDAD removido (ADR-049).
const PERFILES_PUEDEN_PUBLICAR: PerfilFuncional[] = ['DONANTE'];
const OPCIONES_ESTADO: { valor: EstadoDonacion; etiqueta: string }[] = [
  { valor: 'PUBLICADA', etiqueta: 'Publicada' },
  { valor: 'APROBADA', etiqueta: 'Aprobada' },
  { valor: 'ENTREGADA', etiqueta: 'Entregada' },
];

export function DonacionesPage(): JSX.Element {
  const [filtros, setFiltros] = useState<ListarDonacionesFiltros>({ page: 1, limit: 12 });
  const sesion = useSesion();
  const categorias = useCategorias();
  const donaciones = useDonaciones(filtros);

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
          <span className="pagina-encabezado__eyebrow">Comunidad solidaria</span>
          <h1>Donaciones</h1>
          <p>Encuentra objetos disponibles y dales una segunda vida.</p>
        </div>
        {puedePublicar ? (
          <Link to="/donaciones/nueva" className="btn btn--primario">
            Publicar donación
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

      {donaciones.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {donaciones.isError ? <p className="estado-lista">No se pudieron cargar las donaciones.</p> : null}
      {donaciones.data && donaciones.data.data.length === 0 ? (
        hayFiltrosActivos ? (
          <EstadoVacio
            icono="🔍"
            titulo="Ninguna donación coincide con estos filtros"
            descripcion="Prueba con otra categoría o estado."
            accion={{ texto: 'Limpiar filtros', onClick: () => setFiltros({ page: 1, limit: 12 }) }}
          />
        ) : (
          <EstadoVacio
            icono="🎁"
            titulo="Aún no hay donaciones publicadas"
            descripcion={puedePublicar ? 'Sé la primera persona en donar algo a la comunidad.' : undefined}
            accion={puedePublicar ? { texto: '+ Publicar donación', to: '/donaciones/nueva' } : undefined}
          />
        )
      ) : null}

      {donaciones.data && donaciones.data.data.length > 0 ? (
        <>
          <div className="grid-publicaciones">
            {donaciones.data.data.map((donacion) => (
              <DonacionCard key={donacion.id} donacion={donacion} />
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
              Página {donaciones.data.meta.page} de {donaciones.data.meta.totalPages || 1}
            </span>
            <Button
              type="button"
              variant="secundario"
              disabled={(filtros.page ?? 1) >= donaciones.data.meta.totalPages}
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
