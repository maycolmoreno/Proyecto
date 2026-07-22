import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { useMatches } from '../hooks/useMatches.js';
import type { EntidadTipoIA } from '../types/index.js';

interface MatchesSugeridosProps {
  entidadTipo: EntidadTipoIA;
  entidadId: string;
}

const RUTA_POR_TIPO: Record<EntidadTipoIA, string> = {
  DONACION: '/donaciones',
  SOLICITUD: '/solicitudes',
  TRUEQUE: '/trueques',
};

// Sección "coincidencias sugeridas" (RF-016) — cada tipo de candidato tiene un campo de estado
// distinto (estadoDonacion/estadoSolicitud/estadoTrueque) y solo Donación/Trueque tienen imágenes;
// se resuelve aquí en vez de en PublicacionCard (que se mantiene agnóstica del dominio, ADR-045).
function estadoDe(tipo: EntidadTipoIA, candidato: Record<string, unknown>): string {
  if (tipo === 'DONACION') return candidato.estadoDonacion as string;
  if (tipo === 'SOLICITUD') return candidato.estadoSolicitud as string;
  return candidato.estadoTrueque as string;
}

function imagenDe(candidato: Record<string, unknown>): string | undefined {
  const imagenes = candidato.imagenes as string[] | undefined;
  return imagenes?.[0];
}

export function MatchesSugeridos({ entidadTipo, entidadId }: MatchesSugeridosProps): JSX.Element | null {
  const { items, isLoading, isError, tipoCandidato } = useMatches(entidadTipo, entidadId);

  if (isLoading) return null;
  if (isError) {
    return (
      <div>
        <h2>Coincidencias sugeridas</h2>
        <p className="estado-lista">No se pudieron cargar las coincidencias sugeridas. Intenta de nuevo más tarde.</p>
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <div>
      <h2>Coincidencias sugeridas</h2>
      <div className="grid-publicaciones">
        {items
          .filter((item) => item.candidato)
          .map((item) => {
            const candidato = item.candidato as unknown as Record<string, unknown>;
            return (
              <PublicacionCard
                key={item.match.candidatoId}
                rutaDetalle={`${RUTA_POR_TIPO[tipoCandidato]}/${item.match.candidatoId}`}
                titulo={candidato.titulo as string}
                imagenUrl={imagenDe(candidato)}
                estado={estadoDe(tipoCandidato, candidato)}
              />
            );
          })}
      </div>
    </div>
  );
}
