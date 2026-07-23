import { Link } from 'react-router-dom';
import { Avatar } from '@shared/components/atoms/Avatar';

interface DonorCardProps {
  esDueño: boolean;
  nombreDonante: string | undefined;
  donanteId: string;
  haySesion: boolean;
}

// Rediseño de DonacionDetallePage (2026-07-23) — identidad del donante. GET /usuarios/:id
// (usuariosApi.obtenerPorId) solo expone {id, nombre} a propósito (ver usuarios.api.ts) — no hay
// correo, teléfono, fecha de registro, conteo de donaciones ni "verificado" para exponer, así que
// esas filas del mockup de referencia no se muestran (no simular datos). Sin ruta pública de perfil
// por id en el proyecto, tampoco hay "Ver perfil" al que enlazar.
export function DonorCard({ esDueño, nombreDonante, donanteId, haySesion }: DonorCardProps): JSX.Element | null {
  if (esDueño) {
    return (
      <div className="tarjeta donacion-donante">
        <p className="donacion-donante__propia">Esta es tu publicación.</p>
      </div>
    );
  }

  if (!nombreDonante) return null;

  return (
    <div className="tarjeta donacion-donante">
      <div className="donacion-donante__identidad">
        <Avatar nombre={nombreDonante} />
        <p className="donacion-donante__nombre">{nombreDonante}</p>
      </div>
      {haySesion ? (
        <Link to={`/conversaciones/${donanteId}`} className="btn btn--secundario donacion-donante__mensaje">
          Enviar mensaje
        </Link>
      ) : null}
    </div>
  );
}
