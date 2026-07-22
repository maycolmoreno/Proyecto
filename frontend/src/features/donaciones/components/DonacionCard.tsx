import { PublicacionCard } from '@shared/components/molecules/PublicacionCard';
import { useUsuarioPublico } from '@features/identidad/hooks/useUsuarioPublico';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useEsFavorito } from '@features/favoritos/hooks/useEsFavorito';
import { useToggleFavorito } from '@features/favoritos/hooks/useToggleFavorito';
import type { Donacion } from '../types/index.js';

interface DonacionCardProps {
  donacion: Donacion;
}

// Mismo patrón que SolicitudCard: resuelve el nombre del donante (PublicacionCard es agnóstica de
// dominio, ADR-045) y pasa categoría/fecha, datos reales que el listado de Donaciones no mostraba
// antes (auditoría de espacio muerto 2026-07-21).
export function DonacionCard({ donacion }: DonacionCardProps): JSX.Element {
  const donante = useUsuarioPublico(donacion.donanteId);
  const sesion = useSesion();
  const favorito = useEsFavorito('DONACION', donacion.id);
  const toggleFavorito = useToggleFavorito();

  return (
    <PublicacionCard
      rutaDetalle={`/donaciones/${donacion.id}`}
      titulo={donacion.titulo}
      imagenUrl={donacion.imagenes[0]}
      estado={donacion.estadoDonacion}
      categoria={donacion.categoria.nombre}
      fecha={donacion.fecha}
      ubicacion={donacion.ubicacionRetiro ? `${donacion.ubicacionRetiro.ciudad}, ${donacion.ubicacionRetiro.provincia}` : undefined}
      autorNombre={donante.data?.nombre}
      favorito={favorito}
      onToggleFavorito={
        sesion.data ? () => toggleFavorito.mutate({ tipoEntidad: 'DONACION', entidadId: donacion.id, esFavorito: favorito }) : undefined
      }
    />
  );
}
