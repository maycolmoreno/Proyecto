import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Stepper } from '@shared/components/molecules/Stepper';
import { UrgenciaSelector } from './UrgenciaSelector';
import { Input } from '@shared/components/atoms/Input';
import { TextArea } from '@shared/components/atoms/TextArea';
import { Select } from '@shared/components/atoms/Select';
import { Button } from '@shared/components/atoms/Button';
import { Modal } from '@shared/components/organisms/Modal';
import { SelectorUbicacion } from '@shared/components/molecules/SelectorUbicacion';
import { IASuggestionBox } from '@shared/components/molecules/IASuggestionBox';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { claseUrgencia } from '@shared/lib/estado-color';
import type { UbicacionInput } from '@shared/lib/ubicacion';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useClasificar } from '@features/ia/hooks/useClasificar';
import { useCrearSolicitud } from '../hooks/useCrearSolicitud.js';
import { ApiError } from '@shared/lib/http-client';
import type { Urgencia } from '../types/index.js';

// Fase 5, sección 2.4 — 5 pasos (RNF-014). A diferencia de Donación, no hay problema de secuencia
// (la evidencia es solo una URL, no requiere subida) — se crea la Solicitud completa en el paso 5.
const TOTAL_PASOS = 5;
const OPCIONES_URGENCIA: { valor: Urgencia; etiqueta: string }[] = [
  { valor: 'BAJA', etiqueta: 'Baja' },
  { valor: 'MEDIA', etiqueta: 'Media' },
  { valor: 'ALTA', etiqueta: 'Alta' },
];

const UBICACION_VACIA: UbicacionInput = { provincia: '', ciudad: '' };
const LIMITE_DESCRIPCION = 500;

// Rediseño visual (2026-07-22, mismo tratamiento en Donación/Trueque desde 2026-07-23): etiquetas
// cortas para el stepper y copy de encabezado por paso. El ORDEN y CONTENIDO de los 5 pasos no
// cambia (categoría+título → descripción+urgencia → evidencia → ubicación → revisión).
const ETIQUETAS_STEPPER = ['Categoría', 'Descripción y urgencia', 'Evidencia', 'Ubicación', 'Revisión'];
const TITULOS_PASO = ['Categoría y título', 'Descripción y urgencia', 'Evidencia', 'Ubicación', 'Revisión'];
const AYUDA_PASO = [
  'Elige la categoría que mejor describe tu necesidad y dale un título claro.',
  'Cuéntanos más sobre lo que necesitas y qué tan urgente es.',
  'Un enlace ayuda a que los donantes confíen más en tu solicitud (opcional).',
  '¿Dónde te encuentras? Esto ayuda a conectar con donantes cercanos.',
  'Revisa los datos antes de publicar tu solicitud.',
];

// Desliza el contenido del paso en la dirección en que se navega (Siguiente/Atrás) — la dirección
// es información real del gesto, no decoración (skill motion-framer, 2026-07-21).
const VARIANTES_PASO = {
  entra: (direccion: number) => ({ opacity: 0, x: direccion > 0 ? 24 : -24 }),
  centro: { opacity: 1, x: 0 },
  sale: (direccion: number) => ({ opacity: 0, x: direccion > 0 ? -24 : 24 }),
};

export function SolicitudWizard(): JSX.Element {
  const [paso, setPaso] = useState(1);
  const [direccion, setDireccion] = useState(1);
  const [categoriaId, setCategoriaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [urgencia, setUrgencia] = useState<Urgencia>('MEDIA');
  const [evidenciaUrl, setEvidenciaUrl] = useState('');
  const [ubicacion, setUbicacion] = useState<UbicacionInput>(UBICACION_VACIA);
  const [sugerencia, setSugerencia] = useState<{
    tituloSugerido: string;
    descripcionSugerida: string;
    prioridadSugerida: string | null;
  } | null>(null);
  const [sugerenciaAplicada, setSugerenciaAplicada] = useState(false);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);

  const sesion = useSesion();
  const categorias = useCategorias();
  const crearSolicitud = useCrearSolicitud();
  const clasificar = useClasificar();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const prefiereReducirMovimiento = useReducedMotion();

  const categoriaSeleccionada = (categorias.data ?? []).find((c) => c.id === categoriaId);

  async function sugerirConIA(): Promise<void> {
    try {
      const resultado = await clasificar.mutateAsync({ titulo, descripcion, esSolicitud: true });
      setSugerencia(resultado);
    } catch {
      mostrarToast('No se pudo obtener la sugerencia de IA.', 'error');
    }
  }

  function aplicarSugerencia(): void {
    if (!sugerencia) return;
    setTitulo(sugerencia.tituloSugerido);
    setDescripcion(sugerencia.descripcionSugerida);
    if (sugerencia.prioridadSugerida) setUrgencia(sugerencia.prioridadSugerida as Urgencia);
    setSugerenciaAplicada(true);
  }

  function siguiente(): void {
    setDireccion(1);
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  }

  function atras(): void {
    setDireccion(-1);
    setPaso((p) => Math.max(p - 1, 1));
  }

  async function publicar(): Promise<void> {
    try {
      const solicitud = await crearSolicitud.mutateAsync({
        titulo,
        descripcion,
        categoriaId,
        urgencia,
        ubicacion,
        evidenciaUrl: evidenciaUrl || undefined,
      });
      mostrarToast('Solicitud publicada con éxito.', 'exito');
      navigate(`/solicitudes/${solicitud.id}`);
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo publicar la solicitud. Intenta de nuevo.';
      mostrarToast(mensaje, 'error');
    }
  }

  // Validación por paso — mismo bug real que DonacionWizard: "Usar mi ubicación actual" solo
  // llena lat/lng (GPS), nunca provincia/ciudad; sin este chequeo el backend rechaza con 400
  // (`ubicacion` es siempre requerida en Solicitud, a diferencia de la de retiro en Donación).
  const puedeAvanzar =
    paso === 1
      ? Boolean(categoriaId && titulo)
      : paso === 2
        ? Boolean(descripcion)
        : paso === 4
          ? Boolean(ubicacion.provincia && ubicacion.ciudad)
          : true;

  return (
    <>
      <Stepper pasoActual={paso} totalPasos={TOTAL_PASOS} etiquetas={ETIQUETAS_STEPPER} />

      <div className="wizard-layout">
        <div className="wizard-layout__principal">
          <AnimatePresence mode="wait" custom={direccion} initial={false}>
            <motion.div
              key={paso}
              custom={direccion}
              variants={VARIANTES_PASO}
              initial="entra"
              animate="centro"
              exit="sale"
              transition={{ duration: prefiereReducirMovimiento ? 0 : 0.22, ease: 'easeOut' }}
              className="wizard-card"
            >
              <div className="wizard-card__encabezado">
                <h2>{TITULOS_PASO[paso - 1]}</h2>
                <p className="wizard-card__ayuda">{AYUDA_PASO[paso - 1]}</p>
              </div>

              {paso === 1 ? (
                <>
                  <Select
                    label="Categoría"
                    name="categoriaId"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    opciones={(categorias.data ?? []).map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
                    placeholder={categorias.isLoading ? 'Cargando categorías…' : 'Selecciona una categoría'}
                    required
                  />
                  <Input label="Título" name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                </>
              ) : null}

              {paso === 2 ? (
                <>
                  <div className="campo-descripcion">
                    <TextArea
                      label="Descripción"
                      name="descripcion"
                      placeholder="Describe qué necesitas, para quién es y por qué es importante…"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value.slice(0, LIMITE_DESCRIPCION))}
                      maxLength={LIMITE_DESCRIPCION}
                      required
                    />
                    <span className="campo-descripcion__contador">
                      {descripcion.length} / {LIMITE_DESCRIPCION}
                    </span>
                  </div>

                  <UrgenciaSelector value={urgencia} onChange={setUrgencia} />

                  <div className="franja-tip">
                    <p className="franja-tip__titulo">
                      <span aria-hidden="true">💡</span> Sé claro y específico
                    </p>
                    <p className="franja-tip__texto">
                      Una buena descripción ayuda a que las personas entiendan mejor tu necesidad y puedan ayudarte.
                    </p>
                  </div>
                </>
              ) : null}

              {paso === 3 ? (
                <div>
                  <p className="aviso-info">
                    Un enlace a una foto o documento (ej. una receta médica, una foto del objeto dañado) ayuda a que los donantes
                    confíen más en tu solicitud. Puedes subirlo a Google Drive, Imgur u otro servicio y pegar el enlace acá.
                  </p>
                  <Input
                    label="Enlace de evidencia (opcional)"
                    name="evidenciaUrl"
                    type="url"
                    placeholder="https://…"
                    value={evidenciaUrl}
                    onChange={(e) => setEvidenciaUrl(e.target.value)}
                  />
                </div>
              ) : null}

              {paso === 4 ? (
                <SelectorUbicacion value={ubicacion} onChange={setUbicacion} ubicacionRegistrada={sesion.data?.ubicacion ?? null} />
              ) : null}

              {paso === 5 ? (
                <div className="wizard-revision">
                  <p>
                    <strong>{titulo}</strong>
                  </p>
                  <p>{descripcion}</p>
                  <p>
                    Urgencia: <span className={claseUrgencia(urgencia)}>{urgencia}</span>
                  </p>
                  <p>
                    Ubicación: {ubicacion.ciudad}, {ubicacion.provincia}
                  </p>
                  <IASuggestionBox
                    sugerencia={sugerencia}
                    cargando={clasificar.isPending}
                    aplicada={sugerenciaAplicada}
                    onSugerir={sugerirConIA}
                    onAplicar={aplicarSugerencia}
                  />
                </div>
              ) : null}

              <div className="wizard-card__acciones">
                <Button type="button" variant="secundario" onClick={atras} disabled={paso === 1}>
                  Atrás
                </Button>
                {paso < TOTAL_PASOS ? (
                  <Button type="button" onClick={siguiente} disabled={!puedeAvanzar}>
                    Guardar y continuar <span aria-hidden="true">→</span>
                  </Button>
                ) : (
                  <Button type="button" onClick={publicar} disabled={crearSolicitud.isPending || !puedeAvanzar}>
                    {crearSolicitud.isPending ? 'Publicando…' : 'Publicar solicitud'}
                  </Button>
                )}
              </div>
              {paso === 4 && !puedeAvanzar ? <p className="form-field__error">Completa provincia y ciudad para continuar.</p> : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="wizard-layout__sidebar">
          <div className="tarjeta">
            <h3>Resumen de tu solicitud</h3>
            <dl className="lista-datos">
              <div className="lista-datos__fila">
                <dt>Categoría</dt>
                <dd>{categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Pendiente'}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>Título</dt>
                <dd>{titulo || 'Pendiente'}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>Urgencia</dt>
                <dd>{urgencia ? OPCIONES_URGENCIA.find((o) => o.valor === urgencia)?.etiqueta : 'Pendiente'}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>Ubicación</dt>
                <dd>{ubicacion.ciudad && ubicacion.provincia ? `${ubicacion.ciudad}, ${ubicacion.provincia}` : 'Pendiente'}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>Evidencia</dt>
                <dd>{evidenciaUrl ? 'Agregada' : 'Pendiente'}</dd>
              </div>
            </dl>
            <Button type="button" variant="secundario" onClick={() => setVistaPreviaAbierta(true)} disabled={!titulo}>
              Vista previa
            </Button>
          </div>

          <div className="tarjeta">
            <h3>Consejos para una mejor publicación</h3>
            <ul className="consejos-lista">
              <li>
                <span aria-hidden="true">📝</span> Describe el estado del artículo o lo que necesitas con claridad.
              </li>
              <li>
                <span aria-hidden="true">🙋</span> Explica para quién es y por qué lo necesitas.
              </li>
              <li>
                <span aria-hidden="true">🔒</span> Evita compartir datos personales o información sensible.
              </li>
              <li>
                <span aria-hidden="true">📎</span> Agrega fotografías claras en el siguiente paso.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {vistaPreviaAbierta ? (
        <Modal titulo="Vista previa de tu solicitud" onCerrar={() => setVistaPreviaAbierta(false)}>
          <div className="vista-previa">
            <p className="vista-previa__titulo">{titulo || 'Sin título'}</p>
            <p className="vista-previa__descripcion">{descripcion || 'Sin descripción todavía.'}</p>
            <div className="vista-previa__badges">
              <span className={claseUrgencia(urgencia)}>{urgencia}</span>
              {categoriaSeleccionada ? <span className="badge badge--tipo">{categoriaSeleccionada.nombre}</span> : null}
            </div>
            <p className="vista-previa__ubicacion">
              📍 {ubicacion.ciudad && ubicacion.provincia ? `${ubicacion.ciudad}, ${ubicacion.provincia}` : 'Ubicación pendiente'}
            </p>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
