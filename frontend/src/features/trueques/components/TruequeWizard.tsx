import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Stepper } from '@shared/components/molecules/Stepper';
import { EstadoObjetoSelector } from '@shared/components/molecules/EstadoObjetoSelector';
import { Input } from '@shared/components/atoms/Input';
import { TextArea } from '@shared/components/atoms/TextArea';
import { Select } from '@shared/components/atoms/Select';
import { Button } from '@shared/components/atoms/Button';
import { Modal } from '@shared/components/organisms/Modal';
import { IASuggestionBox } from '@shared/components/molecules/IASuggestionBox';
import { subirACloudinary } from '@shared/lib/cloudinary';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { etiquetaEstadoObjeto } from '@shared/lib/estado-color';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useClasificar } from '@features/ia/hooks/useClasificar';
import { useCrearTrueque } from '../hooks/useCrearTrueque.js';
import { truequesApi } from '../api/trueques.api.js';
import { ApiError } from '@shared/lib/http-client';
import { useMatches } from '@features/ia/hooks/useMatches';
import { MatchesSugeridos } from '@features/ia/components/MatchesSugeridos';
import type { EstadoObjeto, Trueque } from '../types/index.js';

// Fase 5, sección 2.4 — 5 pasos. Mismo problema de secuencia que DonacionWizard (el backend exige
// que el Trueque exista para firmar subida de fotos) — el paso 3 solo acumula archivos en memoria;
// la creación real + subida ocurre al confirmar el paso 5. A diferencia de Donación/Solicitud,
// Trueque no modela ubicación (TruequeCreateDTO no la incluye, Fase 4 sección 4).
//
// El paso 4 "¿qué buscas a cambio?" (Fase 5, sección 2.4) no tiene campo propio en el backend
// (crearTruequeSchema solo acepta titulo/descripcion/categoriaId/estadoObjeto) — se concatena al
// final de `descripcion` con un separador visible, decisión documentada en docs/PLAN_FRONTEND.md (F3).
const TOTAL_PASOS = 5;
const ESTADOS_OBJETO: { valor: EstadoObjeto; etiqueta: string }[] = [
  { valor: 'NUEVO', etiqueta: 'Nuevo' },
  { valor: 'BUEN_ESTADO', etiqueta: 'Buen estado' },
  { valor: 'USADO', etiqueta: 'Usado' },
  { valor: 'REQUIERE_REPARACION', etiqueta: 'Requiere reparación' },
];
const LIMITE_DESCRIPCION = 500;

// Rediseño visual (2026-07-23, mismo tratamiento que SolicitudWizard 2026-07-22). El ORDEN y
// CONTENIDO de los 5 pasos no cambia (categoría+título → descripción+estado → fotos → qué buscas a
// cambio → revisión); solo se renombran para el nuevo stepper/tarjeta.
const ETIQUETAS_STEPPER = ['Categoría', 'Descripción y estado', 'Fotos', 'A cambio', 'Revisión'];
const TITULOS_PASO = ['Categoría y título', 'Descripción y estado', 'Fotos', '¿Qué buscas a cambio?', 'Revisión'];
const AYUDA_PASO = [
  'Elige la categoría que mejor describe tu objeto y dale un título claro.',
  'Cuéntanos más sobre el objeto y en qué estado se encuentra.',
  'Las publicaciones con foto se notan más en el listado.',
  'Cuanto más específico seas, mejor podremos sugerirte trueques que coincidan.',
  'Revisa los datos antes de publicar tu trueque.',
];

// Desliza el contenido del paso en la dirección en que se navega (Siguiente/Atrás) — la dirección
// es información real del gesto, no decoración (skill motion-framer, 2026-07-21).
const VARIANTES_PASO = {
  entra: (direccion: number) => ({ opacity: 0, x: direccion > 0 ? 24 : -24 }),
  centro: { opacity: 1, x: 0 },
  sale: (direccion: number) => ({ opacity: 0, x: direccion > 0 ? -24 : 24 }),
};

export function TruequeWizard(): JSX.Element {
  const [paso, setPaso] = useState(1);
  const [direccion, setDireccion] = useState(1);
  const [categoriaId, setCategoriaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estadoObjeto, setEstadoObjeto] = useState<EstadoObjeto>('BUEN_ESTADO');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [queBuscas, setQueBuscas] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [truequePublicado, setTruequePublicado] = useState<Trueque | null>(null);
  const [sugerencia, setSugerencia] = useState<{
    tituloSugerido: string;
    descripcionSugerida: string;
    prioridadSugerida: string | null;
  } | null>(null);
  const [sugerenciaAplicada, setSugerenciaAplicada] = useState(false);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);

  const categorias = useCategorias();
  const crearTrueque = useCrearTrueque();
  const clasificar = useClasificar();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefiereReducirMovimiento = useReducedMotion();
  // Se dispara ni bien hay id (mismo query que MatchesSugeridos, TanStack Query la deduplica) —
  // se usa acá solo para controlar los mensajes de carga/vacío/error del paso de resultado.
  const matches = useMatches('TRUEQUE', truequePublicado?.id);

  const categoriaSeleccionada = (categorias.data ?? []).find((c) => c.id === categoriaId);

  async function sugerirConIA(): Promise<void> {
    try {
      const resultado = await clasificar.mutateAsync({ titulo, descripcion, esSolicitud: false });
      setSugerencia(resultado);
    } catch {
      mostrarToast('No se pudo obtener la sugerencia de IA.', 'error');
    }
  }

  function aplicarSugerencia(): void {
    if (!sugerencia) return;
    setTitulo(sugerencia.tituloSugerido);
    setDescripcion(sugerencia.descripcionSugerida);
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

  function agregarArchivos(evento: React.ChangeEvent<HTMLInputElement>): void {
    const nuevos = Array.from(evento.target.files ?? []);
    setArchivos((actuales) => [...actuales, ...nuevos]);
    evento.target.value = '';
  }

  async function publicar(): Promise<void> {
    setPublicando(true);
    const descripcionFinal = queBuscas.trim()
      ? `${descripcion}\n\n¿Qué busco a cambio?\n${queBuscas.trim()}`
      : descripcion;

    // Dos try/catch separados a propósito (mismo criterio que DonacionWizard): si falla la subida
    // de fotos, el Trueque YA existe en BD — no debe reportarse como "no se pudo publicar", eso
    // llevaba a reintentos que duplicaban la publicación.
    let trueque: Awaited<ReturnType<typeof crearTrueque.mutateAsync>>;
    try {
      trueque = await crearTrueque.mutateAsync({
        titulo,
        descripcion: descripcionFinal,
        categoriaId,
        estadoObjeto,
      });
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo publicar el trueque. Intenta de nuevo.';
      mostrarToast(mensaje, 'error');
      setPublicando(false);
      return;
    }

    try {
      for (const archivo of archivos) {
        const firma = await truequesApi.firmarImagen(trueque.id, archivo.type, archivo.size);
        const resultado = await subirACloudinary(firma, archivo);
        await truequesApi.registrarImagen(trueque.id, resultado.url, resultado.publicId);
      }
      mostrarToast('Trueque publicado con éxito.', 'exito');
    } catch {
      mostrarToast('Trueque publicado, pero no se pudieron subir todas las fotos. Podés agregarlas desde el detalle.', 'info');
    } finally {
      // `crearTrueque` invalidó ['trueques'] antes de que existieran las fotos — sin esto, el
      // listado se queda con la versión sin foto en caché (mismo bug real de DonacionWizard) 2026-07-23.
      await queryClient.invalidateQueries({ queryKey: ['trueques'] });
    }

    setPublicando(false);
    setTruequePublicado(trueque);
  }

  // Validación por paso — mismo bug real evitado que en DonacionWizard/SolicitudWizard: el wizard no
  // usa <form onSubmit>, así que hay que bloquear el avance explícitamente en JS.
  const puedeAvanzar =
    paso === 1 ? Boolean(categoriaId && titulo) : paso === 2 ? Boolean(descripcion) : true;

  // Tras publicar, en vez de redirigir directo al detalle, buscamos coincidencias con otros
  // trueques ya en el mismo paso (RF-016) — el usuario decide desde acá si quiere proponer un
  // intercambio o simplemente ir a ver su publicación.
  if (truequePublicado) {
    return (
      <motion.div
        className="wizard-card"
        initial={prefiereReducirMovimiento ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h2>¡Trueque publicado con éxito!</h2>
        <p className="wizard-card__ayuda">Buscamos otros trueques publicados que podrían interesarte para intercambiar.</p>
        {matches.isLoading ? <p className="estado-lista">Buscando coincidencias…</p> : null}
        {matches.isError ? (
          <p className="estado-lista">No se pudieron cargar las coincidencias sugeridas. Podés verlas más tarde desde tu trueque.</p>
        ) : null}
        {!matches.isLoading && !matches.isError && matches.items.length === 0 ? (
          <p className="estado-lista">Por ahora no encontramos coincidencias. Te avisaremos si aparece alguna.</p>
        ) : null}
        <MatchesSugeridos entidadTipo="TRUEQUE" entidadId={truequePublicado.id} />
        <div className="wizard-card__acciones">
          <Button type="button" onClick={() => navigate(`/trueques/${truequePublicado.id}`)}>
            Ver mi trueque
          </Button>
        </div>
      </motion.div>
    );
  }

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
                      placeholder="Describe el objeto, su estado y cualquier detalle relevante…"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value.slice(0, LIMITE_DESCRIPCION))}
                      maxLength={LIMITE_DESCRIPCION}
                      required
                    />
                    <span className="campo-descripcion__contador">
                      {descripcion.length} / {LIMITE_DESCRIPCION}
                    </span>
                  </div>

                  <EstadoObjetoSelector value={estadoObjeto} onChange={(v) => setEstadoObjeto(v as EstadoObjeto)} />

                  <div className="franja-tip">
                    <p className="franja-tip__titulo">
                      <span aria-hidden="true">💡</span> Sé claro y específico
                    </p>
                    <p className="franja-tip__texto">
                      Una buena descripción ayuda a que las personas entiendan mejor lo que ofreces y propongan un intercambio.
                    </p>
                  </div>
                </>
              ) : null}

              {paso === 3 ? (
                <div className="wizard-fotos">
                  <p className="aviso-info">Las publicaciones con foto se notan más en el listado — agrega al menos una si puedes.</p>
                  {archivos.length > 0 ? (
                    <div className="image-uploader__grid">
                      {archivos.map((archivo, i) => (
                        <img
                          key={`${archivo.name}-${i}`}
                          src={URL.createObjectURL(archivo)}
                          alt=""
                          className="image-uploader__miniatura"
                        />
                      ))}
                    </div>
                  ) : null}
                  <input
                    className="wizard-fotos__input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={agregarArchivos}
                  />
                </div>
              ) : null}

              {paso === 4 ? (
                <div>
                  <p className="aviso-info">
                    Cuanto más específico seas, mejor podremos sugerirte trueques que coincidan (ej. "ropa de niño talla 6" en
                    vez de "ropa"). Este texto se agrega a la descripción de tu publicación.
                  </p>
                  <TextArea
                    label="¿Qué buscas a cambio? (opcional)"
                    name="queBuscas"
                    placeholder="Ej: busco herramientas de jardinería o algo similar…"
                    value={queBuscas}
                    onChange={(e) => setQueBuscas(e.target.value)}
                  />
                </div>
              ) : null}

              {paso === 5 ? (
                <div className="wizard-revision">
                  <p>
                    <strong>{titulo}</strong>
                  </p>
                  <p>{descripcion}</p>
                  <p>Estado: {ESTADOS_OBJETO.find((e) => e.valor === estadoObjeto)?.etiqueta}</p>
                  <p>Fotos: {archivos.length}</p>
                  {queBuscas.trim() ? <p>Busca a cambio: {queBuscas}</p> : null}
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
                  <Button type="button" onClick={publicar} disabled={publicando || !puedeAvanzar}>
                    {publicando ? 'Publicando…' : 'Publicar trueque'}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="wizard-layout__sidebar">
          <div className="tarjeta">
            <h3>Resumen de tu trueque</h3>
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
                <dt>Estado</dt>
                <dd>{etiquetaEstadoObjeto(estadoObjeto)}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>Fotos</dt>
                <dd>{archivos.length > 0 ? `${archivos.length} agregada${archivos.length > 1 ? 's' : ''}` : 'Pendiente'}</dd>
              </div>
              <div className="lista-datos__fila">
                <dt>A cambio</dt>
                <dd>{queBuscas.trim() ? queBuscas : 'Pendiente'}</dd>
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
                <span aria-hidden="true">📝</span> Describe el estado del objeto con claridad.
              </li>
              <li>
                <span aria-hidden="true">🔁</span> Sé específico sobre qué buscas a cambio.
              </li>
              <li>
                <span aria-hidden="true">🔒</span> Evita compartir datos personales o información sensible.
              </li>
              <li>
                <span aria-hidden="true">📷</span> Agrega fotografías claras en el paso de fotos.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {vistaPreviaAbierta ? (
        <Modal titulo="Vista previa de tu trueque" onCerrar={() => setVistaPreviaAbierta(false)}>
          <div className="vista-previa">
            {archivos.length > 0 ? (
              <img src={URL.createObjectURL(archivos[0]!)} alt="" className="image-uploader__miniatura" />
            ) : null}
            <p className="vista-previa__titulo">{titulo || 'Sin título'}</p>
            <p className="vista-previa__descripcion">{descripcion || 'Sin descripción todavía.'}</p>
            <div className="vista-previa__badges">
              <span className="badge badge--neutral">{etiquetaEstadoObjeto(estadoObjeto)}</span>
              {categoriaSeleccionada ? <span className="badge badge--tipo">{categoriaSeleccionada.nombre}</span> : null}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
