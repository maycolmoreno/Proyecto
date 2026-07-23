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
import { SelectorUbicacion } from '@shared/components/molecules/SelectorUbicacion';
import { IASuggestionBox } from '@shared/components/molecules/IASuggestionBox';
import { subirACloudinary } from '@shared/lib/cloudinary';
import { useToast } from '@shared/components/organisms/ToastProvider';
import { etiquetaEstadoObjeto } from '@shared/lib/estado-color';
import type { UbicacionInput } from '@shared/lib/ubicacion';
import { useSesion } from '@features/identidad/hooks/useSesion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useClasificar } from '@features/ia/hooks/useClasificar';
import { useCrearDonacion } from '../hooks/useCrearDonacion.js';
import { donacionesApi } from '../api/donaciones.api.js';
import { ApiError } from '@shared/lib/http-client';
import type { EstadoObjeto } from '../types/index.js';

// Fase 5, sección 2.4 — 5 pasos (RNF-014). El backend exige que la Donación exista para firmar
// subida de fotos (POST /donaciones/:id/imagenes/firma) y que `ubicacionRetiro` esté completa si
// `requiereRetiro=true` (regla de negocio #5) — ambas condiciones solo se cumplen al final. Por eso
// el paso 3 "Fotos" solo acumula archivos en memoria (preview local); la Donación se crea y las
// fotos se suben recién al confirmar el paso 5. Decisión documentada en docs/PLAN_FRONTEND.md (F1).
const TOTAL_PASOS = 5;
const ESTADOS_OBJETO: { valor: EstadoObjeto; etiqueta: string }[] = [
  { valor: 'NUEVO', etiqueta: 'Nuevo' },
  { valor: 'BUEN_ESTADO', etiqueta: 'Buen estado' },
  { valor: 'USADO', etiqueta: 'Usado' },
  { valor: 'REQUIERE_REPARACION', etiqueta: 'Requiere reparación' },
];

const UBICACION_VACIA: UbicacionInput = { provincia: '', ciudad: '' };
const LIMITE_DESCRIPCION = 500;

// Rediseño visual (2026-07-23, mismo tratamiento que SolicitudWizard 2026-07-22). El ORDEN y
// CONTENIDO de los 5 pasos no cambia (categoría+título → descripción+estado → fotos → ubicación de
// retiro → revisión); solo se renombran para el nuevo stepper/tarjeta.
const ETIQUETAS_STEPPER = ['Categoría', 'Descripción y estado', 'Fotos', 'Retiro', 'Revisión'];
const TITULOS_PASO = ['Categoría y título', 'Descripción y estado', 'Fotos', 'Ubicación de retiro', 'Revisión'];
const AYUDA_PASO = [
  'Elige la categoría que mejor describe tu donación y dale un título claro.',
  'Cuéntanos más sobre el objeto y en qué estado se encuentra.',
  'Las publicaciones con foto se notan más en el listado.',
  '¿Quien lo reciba debe retirarlo en tu ubicación?',
  'Revisa los datos antes de publicar tu donación.',
];

// Desliza el contenido del paso en la dirección en que se navega (Siguiente/Atrás) — la dirección
// es información real del gesto, no decoración (skill motion-framer, 2026-07-21).
const VARIANTES_PASO = {
  entra: (direccion: number) => ({ opacity: 0, x: direccion > 0 ? 24 : -24 }),
  centro: { opacity: 1, x: 0 },
  sale: (direccion: number) => ({ opacity: 0, x: direccion > 0 ? -24 : 24 }),
};

export function DonacionWizard(): JSX.Element {
  const [paso, setPaso] = useState(1);
  const [direccion, setDireccion] = useState(1);
  const [categoriaId, setCategoriaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estadoObjeto, setEstadoObjeto] = useState<EstadoObjeto>('BUEN_ESTADO');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [itemsIncluidos, setItemsIncluidos] = useState<string[]>([]);
  const [nuevoItem, setNuevoItem] = useState('');
  const [requiereRetiro, setRequiereRetiro] = useState(false);
  const [ubicacionRetiro, setUbicacionRetiro] = useState<UbicacionInput>(UBICACION_VACIA);
  const [publicando, setPublicando] = useState(false);
  const [sugerencia, setSugerencia] = useState<{
    tituloSugerido: string;
    descripcionSugerida: string;
    prioridadSugerida: string | null;
  } | null>(null);
  const [sugerenciaAplicada, setSugerenciaAplicada] = useState(false);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);

  const sesion = useSesion();
  const categorias = useCategorias();
  const crearDonacion = useCrearDonacion();
  const clasificar = useClasificar();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefiereReducirMovimiento = useReducedMotion();

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

  function agregarItemIncluido(): void {
    const item = nuevoItem.trim();
    if (!item) return;
    setItemsIncluidos((actuales) => [...actuales, item]);
    setNuevoItem('');
  }

  function quitarItemIncluido(indice: number): void {
    setItemsIncluidos((actuales) => actuales.filter((_, i) => i !== indice));
  }

  function agregarArchivos(evento: React.ChangeEvent<HTMLInputElement>): void {
    const nuevos = Array.from(evento.target.files ?? []);
    setArchivos((actuales) => [...actuales, ...nuevos]);
    evento.target.value = '';
  }

  async function publicar(): Promise<void> {
    setPublicando(true);

    // Dos try/catch separados a propósito: si la creación falla, no existe nada aún y el usuario
    // debe reintentar desde el wizard. Si falla la subida de fotos, la Donación YA existe en BD —
    // mostrar "no se pudo publicar" ahí llevaba a reintentos que duplicaban la publicación.
    let donacion: Awaited<ReturnType<typeof crearDonacion.mutateAsync>>;
    try {
      donacion = await crearDonacion.mutateAsync({
        titulo,
        descripcion,
        categoriaId,
        estadoObjeto,
        requiereRetiro,
        ubicacionRetiro: requiereRetiro ? ubicacionRetiro : undefined,
        itemsIncluidos: itemsIncluidos.length > 0 ? itemsIncluidos : undefined,
      });
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : 'No se pudo publicar la donación. Intenta de nuevo.';
      mostrarToast(mensaje, 'error');
      setPublicando(false);
      return;
    }

    try {
      for (const archivo of archivos) {
        const firma = await donacionesApi.firmarImagen(donacion.id, archivo.type, archivo.size);
        const resultado = await subirACloudinary(firma, archivo);
        await donacionesApi.registrarImagen(donacion.id, resultado.url, resultado.publicId);
      }
      mostrarToast('Donación publicada con éxito.', 'exito');
    } catch {
      mostrarToast('Donación publicada, pero no se pudieron subir todas las fotos. Podés agregarlas desde el detalle.', 'info');
    } finally {
      // `crearDonacion` invalidó ['donaciones'] antes de que existieran las fotos — sin esto, el
      // listado se queda con la versión sin foto en caché hasta el próximo montaje (bug real
      // reportado por el usuario: "subo la foto y la tarjeta sigue mostrando el cartón") 2026-07-23.
      await queryClient.invalidateQueries({ queryKey: ['donaciones'] });
    }

    setPublicando(false);
    navigate(`/donaciones/${donacion.id}`);
  }

  // Validación por paso — el wizard no usa <form onSubmit>, así que el atributo HTML `required`
  // de los campos nunca se dispara solo; hay que bloquear el avance explícitamente. Bug real
  // encontrado en pruebas: "Usar mi ubicación actual" solo llena lat/lng (GPS), nunca
  // provincia/ciudad (exigiría geocoding inverso, fuera de alcance) — sin este chequeo, el
  // backend rechazaba la publicación con 400 y el usuario no entendía por qué.
  const puedeAvanzar =
    paso === 1
      ? Boolean(categoriaId && titulo)
      : paso === 2
        ? Boolean(descripcion)
        : paso === 4 && requiereRetiro
          ? Boolean(ubicacionRetiro.provincia && ubicacionRetiro.ciudad)
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
                      placeholder="Describe el objeto, su estado y cualquier detalle que ayude a quien lo reciba…"
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

                  {/* Opcional — para donaciones con varias piezas (ej. juego de sala): qué incluye
                      exactamente, más allá de la descripción libre. */}
                  <div className="form-field">
                    <label htmlFor="nuevoItemIncluido">¿Qué incluye? (opcional)</label>
                    <div className="fila-agregar-item">
                      <input
                        id="nuevoItemIncluido"
                        type="text"
                        value={nuevoItem}
                        onChange={(e) => setNuevoItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarItemIncluido();
                          }
                        }}
                        placeholder="Ej. Sofá 3 puestos"
                      />
                      <Button type="button" variant="secundario" onClick={agregarItemIncluido} disabled={!nuevoItem.trim()}>
                        Agregar
                      </Button>
                    </div>
                    {itemsIncluidos.length > 0 ? (
                      <div className="chips">
                        {itemsIncluidos.map((item, i) => (
                          <button key={`${item}-${i}`} type="button" className="chip" onClick={() => quitarItemIncluido(i)}>
                            {item} ✕
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="franja-tip">
                    <p className="franja-tip__titulo">
                      <span aria-hidden="true">💡</span> Sé claro y específico
                    </p>
                    <p className="franja-tip__texto">
                      Una buena descripción ayuda a que las personas entiendan mejor lo que ofreces y decidan pedirlo.
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
                <>
                  <p className="aviso-info">
                    Si marcas esta opción, quien reciba la donación verá tu ubicación para coordinar el retiro. Si no la marcas,
                    van a ponerse de acuerdo por chat una vez publicada.
                  </p>
                  <label className="opcion-checkbox">
                    <input type="checkbox" checked={requiereRetiro} onChange={(e) => setRequiereRetiro(e.target.checked)} />
                    Requiere que lo retiren en mi ubicación
                  </label>
                  {requiereRetiro ? (
                    <SelectorUbicacion
                      value={ubicacionRetiro}
                      onChange={setUbicacionRetiro}
                      ubicacionRegistrada={sesion.data?.ubicacion ?? null}
                    />
                  ) : null}
                </>
              ) : null}

              {paso === 5 ? (
                <div className="wizard-revision">
                  <p>
                    <strong>{titulo}</strong>
                  </p>
                  <p>{descripcion}</p>
                  {/* La sugerencia de IA (más abajo) puede equivocarse de categoría — se deja el Select
                      editable acá mismo para corregirla sin retroceder los 4 pasos anteriores. */}
                  <Select
                    label="Categoría"
                    name="categoriaIdRevision"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    opciones={(categorias.data ?? []).map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
                    required
                  />
                  <p>Estado: {ESTADOS_OBJETO.find((e) => e.valor === estadoObjeto)?.etiqueta}</p>
                  {itemsIncluidos.length > 0 ? <p>Incluye: {itemsIncluidos.join(', ')}</p> : null}
                  <p>Fotos: {archivos.length}</p>
                  {requiereRetiro ? (
                    <p>
                      Retiro en: {ubicacionRetiro.ciudad}, {ubicacionRetiro.provincia}
                    </p>
                  ) : null}
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
                    {publicando ? 'Publicando…' : 'Publicar donación'}
                  </Button>
                )}
              </div>
              {paso === 4 && requiereRetiro && !puedeAvanzar ? (
                <p className="form-field__error">Completa provincia y ciudad para continuar.</p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="wizard-layout__sidebar">
          <div className="tarjeta">
            <h3>Resumen de tu donación</h3>
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
                <dt>Retiro</dt>
                <dd>
                  {requiereRetiro
                    ? ubicacionRetiro.ciudad && ubicacionRetiro.provincia
                      ? `${ubicacionRetiro.ciudad}, ${ubicacionRetiro.provincia}`
                      : 'Pendiente'
                    : 'Por chat'}
                </dd>
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
                <span aria-hidden="true">🧩</span> Menciona si incluye accesorios o piezas.
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
        <Modal titulo="Vista previa de tu donación" onCerrar={() => setVistaPreviaAbierta(false)}>
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
