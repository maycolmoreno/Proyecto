import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiltroPanel } from '@shared/components/organisms/FiltroPanel';
import { Button } from '@shared/components/atoms/Button';
import { EstadoVacio } from '@shared/components/molecules/EstadoVacio';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useSolicitudes } from '@features/solicitudes/hooks/useSolicitudes';
import { useMisPublicaciones } from '@features/publicaciones/hooks/useMisPublicaciones';
import { OfertarRapido } from '@features/solicitudes/components/OfertarRapido';
import { SolicitudCard } from '@features/solicitudes/components/SolicitudCard';
import type { ListarSolicitudesFiltros } from '@features/solicitudes/types/index.js';
import type { PerfilFuncional } from '@features/identidad/types/index.js';

// Consejos para quien está evaluando ofrecer ayuda — mismo contenido de confianza/seguridad que
// ya documenta ComoFuncionaPage, resumido acá como checklist rápido (pedido del usuario 2026-07-23).
const CONSEJOS_DONAR = [
  'Lee la descripción completa y verifica la ubicación.',
  'Coordina siempre por mensajes dentro de la plataforma.',
  'Tu seguridad y la de los demás es lo más importante.',
];

// Opción D, Fase 3 (docs/DISENO_MODELO_PERFILES.md) — antes ROLES_PUEDEN_PUBLICAR con rol.
// COMUNIDAD removido (ADR-049).
const PERFILES_PUEDEN_PUBLICAR: PerfilFuncional[] = ['SOLICITANTE'];
// Mismo criterio que SolicitudDetallePage.tsx (PERFILES_PUEDEN_OFERTAR) — repetido acá porque
// la acción rápida vive en esta página, no en un componente compartido.
const PERFILES_PUEDEN_OFERTAR: PerfilFuncional[] = ['DONANTE'];

export function SolicitudesPage(): JSX.Element {
  const [filtros, setFiltros] = useState<ListarSolicitudesFiltros>({ page: 1, limit: 12 });
  const sesion = useSesion();
  const categorias = useCategorias();
  const solicitudes = useSolicitudes(filtros);
  const misPublicaciones = useMisPublicaciones(Boolean(sesion.data));

  const puedePublicar = sesion.data && PERFILES_PUEDEN_PUBLICAR.some((p) => sesion.data.perfiles.includes(p));
  // "Resumen" del sidebar — mis propias solicitudes, no las del listado general (mismos estados
  // que uso en SolicitudDetallePage para consistencia).
  const misSolicitudes = (misPublicaciones.data ?? []).filter((p) => p.tipo === 'SOLICITUD');
  const resumenSolicitudes = {
    total: misSolicitudes.length,
    abiertas: misSolicitudes.filter((p) => p.estado === 'ABIERTA').length,
    enCoordinacion: misSolicitudes.filter((p) => p.estado === 'ACEPTADA_POR_DONANTE' || p.estado === 'EN_ENTREGA').length,
    atendidas: misSolicitudes.filter((p) => p.estado === 'ATENDIDA').length,
    canceladas: misSolicitudes.filter((p) => p.estado === 'CANCELADA').length,
  };
  const hayFiltrosActivos = Object.entries(filtros).some(
    ([campo, valor]) => campo !== 'page' && campo !== 'limit' && campo !== 'sort' && Boolean(valor),
  );

  function cambiarFiltro(campo: string, valor: string): void {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor || undefined, page: 1 }));
  }

  return (
    <div className="listado-layout">
      <div className="listado-layout__principal">
      <div className="pagina-encabezado">
        <div className="pagina-encabezado__texto">
          <span className="pagina-encabezado__eyebrow">Ayuda cercana</span>
          <h1>Solicitudes</h1>
          <p>Conoce qué necesita la comunidad y cómo puedes ayudar.</p>
        </div>
        {puedePublicar ? (
          <Link to="/solicitudes/nueva" className="btn btn--primario">
            Publicar solicitud
          </Link>
        ) : null}
      </div>

      <section className="solicitudes-filtros" aria-labelledby="titulo-filtros">
        <div className="solicitudes-filtros__encabezado">
          <div>
            <h2 id="titulo-filtros">Encuentra dónde ayudar</h2>
            <p>Filtra las solicitudes por categoría.</p>
          </div>
          {hayFiltrosActivos ? (
            <button type="button" className="solicitudes-filtros__limpiar" onClick={() => setFiltros({ page: 1, limit: 12 })}>
              Limpiar filtros
            </button>
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
          ]}
          valores={filtros as Record<string, string>}
          onCambiar={cambiarFiltro}
        />
      </section>

      {solicitudes.isLoading ? <p className="estado-lista">Cargando…</p> : null}
      {solicitudes.isError ? <p className="estado-lista">No se pudieron cargar las solicitudes.</p> : null}
      {solicitudes.data && solicitudes.data.data.length === 0 ? (
        hayFiltrosActivos ? (
          <EstadoVacio
            icono="🔍"
            titulo="Ninguna solicitud coincide con estos filtros"
            descripcion="Prueba con otra categoría."
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

      <aside className="listado-layout__sidebar">
        {sesion.data ? (
          <div className="tarjeta">
            <h3>Resumen</h3>
            <dl className="lista-datos">
              <div className="lista-datos__fila">
                <dt>Total solicitudes</dt>
                <dd>{resumenSolicitudes.total}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>🙏 Abiertas</dt>
                <dd>{resumenSolicitudes.abiertas}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>🚚 En coordinación</dt>
                <dd>{resumenSolicitudes.enCoordinacion}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>💚 Atendidas</dt>
                <dd>{resumenSolicitudes.atendidas}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>❌ Canceladas</dt>
                <dd>{resumenSolicitudes.canceladas}</dd>
              </div>
            </dl>
            <Link to="/publicaciones/mias" className="tarjeta__enlace">
              Ver mis solicitudes →
            </Link>
          </div>
        ) : null}

        <div className="tarjeta">
          <h3>Consejos para donar</h3>
          <ul className="consejos-lista">
            {CONSEJOS_DONAR.map((consejo) => (
              <li key={consejo}>
                <span aria-hidden="true">✅</span> {consejo}
              </li>
            ))}
          </ul>
          <Link to="/como-funciona" className="tarjeta__enlace">
            Ver más consejos →
          </Link>
        </div>
      </aside>
    </div>
  );
}
