import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useEsFavorito } from '@features/favoritos/hooks/useEsFavorito';
import { useToggleFavorito } from '@features/favoritos/hooks/useToggleFavorito';
import type { Trueque } from '../types/index.js';

interface TruequeCardProps {
  trueque: Trueque;
}

// Mismo patrón que SolicitudCard: resuelve el nombre de quien publicó (PublicacionCard es agnóstica
// de dominio, ADR-045), cuenta las propuestas recibidas y pasa categoría/fecha — datos reales que el
// listado de Trueques no mostraba antes (auditoría de espacio muerto 2026-07-21).
export function TruequeCard({ trueque }: TruequeCardProps): JSX.Element {
  const usuario = useUsuarioPublico(trueque.usuarioId);
  const sesion = useSesion();
  const favorito = useEsFavorito('TRUEQUE', trueque.id);
  const toggleFavorito = useToggleFavorito();

  return (
    <PublicacionCard
      rutaDetalle={`/trueques/${trueque.id}`}
      titulo={trueque.titulo}
      imagenUrl={trueque.imagenes[0]}
      estado={trueque.estadoTrueque}
      categoria={trueque.categoria.nombre}
      fecha={trueque.fecha}
      autorNombre={usuario.data?.nombre}
      cantidadOfertas={trueque.propuestasRecibidas.length}
      favorito={favorito}
      onToggleFavorito={
        sesion.data
          ? () => toggleFavorito.mutate({ tipoEntidad: 'TRUEQUE', entidadId: trueque.id, esFavorito: favorito })
          : undefined
      }
    />
  );
}
