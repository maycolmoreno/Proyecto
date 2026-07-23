import { Link } from 'react-router-dom';
import { StatusBadge } from '@shared/components/atoms/StatusBadge';
import { Button } from '@shared/components/atoms/Button';
import { TextArea } from '@shared/components/atoms/TextArea';
import { ImageUploader } from '@shared/components/molecules/ImageUploader';
import type { FirmaSubida } from '@shared/lib/cloudinary';
import type { Donacion, Reserva } from '../types/index.js';

// Rediseño de DonacionDetallePage (2026-07-23) — agrupa TODAS las acciones posibles bajo un mismo
// componente, ramificando por dueño/no-dueño y por estado. No crea acciones nuevas: cada botón
// dispara exactamente el mismo handler/mutation que ya existía en la página (pasados por props),
// solo cambia la presentación. "Editar publicación"/"Pausar"/"Reactivar"/"Marcar como entregada" del
// mockup de referencia NO tienen endpoint/hook real en este proyecto (EstadoDonacion no incluye un
// estado "pausada", y no existe ruta de edición) — omitidos a propósito en vez de simular una acción
// que no funcionaría. "Marcar como entregada" ya vive en <CoordinacionEntrega> ("Confirmar entrega"),
// que la página sigue embebiendo sin cambios.
interface DonationActionsProps {
  donacion: Donacion;
  esDueño: boolean;
  haySesion: boolean;
  puedeReservar: boolean;
  miReservaActiva: Reserva | undefined;
  mensajeReserva: string;
  onMensajeReservaChange: (valor: string) => void;
  onReservar: () => void;
  reservando: boolean;
  onAceptarReserva: (reservaId: string) => void;
  onRechazarReserva: (reservaId: string) => void;
  aceptandoReserva: boolean;
  rechazandoReserva: boolean;
  onAbrirCancelar: () => void;
  onFirmarImagen: (mimeType: string, tamanoBytes: number) => Promise<FirmaSubida>;
  onRegistrarImagen: (url: string, publicId: string) => Promise<void>;
}

export function DonationActions({
  donacion,
  esDueño,
  haySesion,
  puedeReservar,
  miReservaActiva,
  mensajeReserva,
  onMensajeReservaChange,
  onReservar,
  reservando,
  onAceptarReserva,
  onRechazarReserva,
  aceptandoReserva,
  rechazandoReserva,
  onAbrirCancelar,
  onFirmarImagen,
  onRegistrarImagen,
}: DonationActionsProps): JSX.Element | null {
  if (esDueño) {
    return (
      <div className="tarjeta donacion-acciones">
        <h3>Gestionar publicación</h3>

        <div className="donacion-acciones__bloque">
          <p className="donacion-acciones__etiqueta">Agregar fotografías</p>
          <ImageUploader imagenes={donacion.imagenes} onFirmar={onFirmarImagen} onRegistrar={onRegistrarImagen} />
        </div>

        {donacion.estadoDonacion !== 'CANCELADA' && donacion.estadoDonacion !== 'ENTREGADA' ? (
          <Button type="button" variant="peligro" onClick={onAbrirCancelar}>
            Cancelar donación
          </Button>
        ) : null}

        {donacion.reservas.length > 0 ? (
          <div className="donacion-acciones__reservas">
            <p className="donacion-acciones__etiqueta">Reservas recibidas</p>
            {donacion.reservas.map((reserva) => (
              <div key={reserva.id} className="oferta-item">
                <StatusBadge estado={reserva.estado} />
                {reserva.mensaje ? <p>{reserva.mensaje}</p> : null}
                {reserva.estado === 'PENDIENTE' ? (
                  <div className="donacion-acciones__fila-botones">
                    <Button onClick={() => onAceptarReserva(reserva.id)} disabled={aceptandoReserva}>
                      Aceptar
                    </Button>
                    <Button variant="peligro" onClick={() => onRechazarReserva(reserva.id)} disabled={rechazandoReserva}>
                      Rechazar
                    </Button>
                  </div>
                ) : null}
                {reserva.estado === 'ACEPTADA' ? (
                  <Button variant="peligro" onClick={() => onRechazarReserva(reserva.id)} disabled={rechazandoReserva}>
                    Rechazar
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (miReservaActiva) {
    return (
      <div className="tarjeta donacion-acciones">
        <p>
          Tu solicitud está <StatusBadge estado={miReservaActiva.estado} />
        </p>
        <Link to={`/conversaciones/${donacion.donanteId}`} className="btn btn--secundario donacion-acciones__enlace-mensaje">
          Enviar mensaje
        </Link>
      </div>
    );
  }

  if (!puedeReservar) return null;

  return (
    <div className="tarjeta donacion-acciones">
      <h3>¿Te interesa este artículo?</h3>
      <TextArea
        label="Mensaje para el donante (opcional)"
        name="mensajeReserva"
        value={mensajeReserva}
        onChange={(e) => onMensajeReservaChange(e.target.value)}
      />
      <div className="donacion-acciones__fila-botones">
        <Button type="button" onClick={onReservar} disabled={reservando}>
          {reservando ? 'Enviando…' : 'Solicitar donación'}
        </Button>
        {haySesion ? (
          <Link to={`/conversaciones/${donacion.donanteId}`} className="btn btn--secundario">
            Enviar mensaje
          </Link>
        ) : null}
      </div>
    </div>
  );
}
