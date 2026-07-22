import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useEsFavorito } from '@features/favoritos/hooks/useEsFavorito';
import { useToggleFavorito } from '@features/favoritos/hooks/useToggleFavorito';
import type { Solicitud } from '../types/index.js';

interface SolicitudCardProps {
  solicitud: Solicitud;
}

// Resuelve el nombre del solicitante (PublicacionCard es agnóstica de dominio, ADR-045 — no sabe
// llamar a /usuarios/:id) y cuenta las ofertas ya recibidas, ambos datos reales del backend que el
// listado de Solicitudes no mostraba antes.
export function SolicitudCard({ solicitud }: SolicitudCardProps): JSX.Element {
  const solicitante = useUsuarioPublico(solicitud.beneficiarioId);
  const sesion = useSesion();
  const favorito = useEsFavorito('SOLICITUD', solicitud.id);
  const toggleFavorito = useToggleFavorito();

  return (
    <PublicacionCard
      rutaDetalle={`/solicitudes/${solicitud.id}`}
      titulo={solicitud.titulo}
      estado={solicitud.estadoSolicitud}
      urgencia={solicitud.urgencia}
      categoria={solicitud.categoria.nombre}
      fecha={solicitud.fecha}
      ubicacion={`${solicitud.ubicacion.ciudad}, ${solicitud.ubicacion.provincia}`}
      autorNombre={solicitante.data?.nombre}
      cantidadOfertas={solicitud.ofertas.length}
      favorito={favorito}
      onToggleFavorito={
        sesion.data
          ? () => toggleFavorito.mutate({ tipoEntidad: 'SOLICITUD', entidadId: solicitud.id, esFavorito: favorito })
          : undefined
      }
    />
  );
}
