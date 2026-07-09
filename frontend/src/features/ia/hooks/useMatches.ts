import { useQueries, useQuery } from '@tanstack/react-query';
import { donacionesApi } from '@features/donaciones/api/donaciones.api.js';
import { solicitudesApi } from '@features/solicitudes/api/solicitudes.api.js';
import { truequesApi } from '@features/trueques/api/trueques.api.js';
import { iaApi } from '../api/ia.api.js';
import type { EntidadTipoIA } from '../types/index.js';

// El backend (MatchingService) solo devuelve {candidatoId, score, razon} — sin datos enriquecidos
// (RF-016) — hay que resolver cada candidato por separado contra su propio módulo. El tipo de
// candidato es siempre el "opuesto" al de origen (Donación↔Solicitud), salvo Trueque↔Trueque.
function tipoCandidatoDe(entidadTipo: EntidadTipoIA): EntidadTipoIA {
  if (entidadTipo === 'DONACION') return 'SOLICITUD';
  if (entidadTipo === 'SOLICITUD') return 'DONACION';
  return 'TRUEQUE';
}

function obtenerCandidato(tipoCandidato: EntidadTipoIA, id: string) {
  if (tipoCandidato === 'DONACION') return donacionesApi.obtener(id);
  if (tipoCandidato === 'SOLICITUD') return solicitudesApi.obtener(id);
  return truequesApi.obtener(id);
}

// Hook puro (RF-016) — combina GET /ia/matching con una consulta por candidato para poder
// renderizarlos con PublicacionCard en el detalle de la publicación.
export function useMatches(entidadTipo: EntidadTipoIA, entidadId: string | undefined) {
  const tipoCandidato = tipoCandidatoDe(entidadTipo);

  const matches = useQuery({
    queryKey: ['ia', 'matching', entidadTipo, entidadId],
    queryFn: () => iaApi.matching(entidadTipo, entidadId!),
    enabled: Boolean(entidadId),
  });

  const candidatos = useQueries({
    queries: (matches.data ?? []).map((match) => ({
      queryKey: [tipoCandidato.toLowerCase(), match.candidatoId],
      queryFn: () => obtenerCandidato(tipoCandidato, match.candidatoId),
    })),
  });

  const items = (matches.data ?? []).map((match, i) => ({
    match,
    candidato: candidatos[i]?.data,
  }));

  return {
    tipoCandidato,
    items,
    isLoading: matches.isLoading || candidatos.some((c) => c.isLoading),
  };
}
