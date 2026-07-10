import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useDonaciones } from '@features/donaciones/hooks/useDonaciones';
import type { EstadoDonacion, ListarDonacionesFiltros } from '@features/donaciones/types/index.js';

const ROLES_PUEDEN_PUBLICAR = ['DONANTE', 'USUARIO_COMUNIDAD'];
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

  const puedePublicar = sesion.data && ROLES_PUEDEN_PUBLICAR.includes(sesion.data.rol);

  function cambiarFiltro(campo: string, valor: string): void {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor || undefined, page: 1 }));
  }

  return (
    <div>
      <div className="pagina-encabezado">
        <h1>Donaciones</h1>
        {puedePublicar ? (
          <Link to="/donaciones/nueva">
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
          { campo: 'estado', etiqueta: 'Estado', opciones: OPCIONES_ESTADO.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta })) },
        ]}
        valores={filtros as Record<string, string>}
        onCambiar={cambiarFiltro}
      />

      {donaciones.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {donaciones.isError ? <p className="estado-lista">No se pudieron cargar las donaciones.</p> : null}
      {donaciones.data && donaciones.data.data.length === 0 ? (
        <p className="estado-lista">Aún no hay donaciones publicadas — sé el primero.</p>
      ) : null}

      {donaciones.data && donaciones.data.data.length > 0 ? (
        <>
          <div className="grid-publicaciones">
            {donaciones.data.data.map((donacion) => (
              <PublicacionCard
                key={donacion.id}
                rutaDetalle={`/donaciones/${donacion.id}`}
                titulo={donacion.titulo}
                imagenUrl={donacion.imagenes[0]}
                estado={donacion.estadoDonacion}
                ubicacion={
                  donacion.ubicacionRetiro ? `${donacion.ubicacionRetiro.ciudad}, ${donacion.ubicacionRetiro.provincia}` : undefined
                }
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
