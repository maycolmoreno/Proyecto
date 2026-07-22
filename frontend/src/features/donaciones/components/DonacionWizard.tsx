import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Stepper } from '@shared/components/molecules/Stepper';
import { Input } from '@shared/components/atoms/Input';
import { TextArea } from '@shared/components/atoms/TextArea';
import { Select } from '@shared/components/atoms/Select';
import { Button } from '@shared/components/atoms/Button';
import { SelectorUbicacion } from '@shared/components/molecules/SelectorUbicacion';
import { IASuggestionBox } from '@shared/components/molecules/IASuggestionBox';
import { subirACloudinary } from '@shared/lib/cloudinary';
import { useToast } from '@shared/components/organisms/ToastProvider';
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

  const sesion = useSesion();
  const categorias = useCategorias();
  const crearDonacion = useCrearDonacion();
  const clasificar = useClasificar();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const prefiereReducirMovimiento = useReducedMotion();

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
    }

    setPublicando(false);
    navigate(`/donaciones/${donacion.id}`);
  }

  const etiquetasPaso = ['Categoría y título', 'Descripción y estado', 'Fotos', 'Ubicación de retiro', 'Revisión'];

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
    <div className="wizard">
      <Stepper pasoActual={paso} totalPasos={TOTAL_PASOS} etiqueta={etiquetasPaso[paso - 1]!} />

      <AnimatePresence mode="wait" custom={direccion} initial={false}>
      <motion.div
        key={paso}
        custom={direccion}
        variants={VARIANTES_PASO}
        initial="entra"
        animate="centro"
        exit="sale"
        transition={{ duration: prefiereReducirMovimiento ? 0 : 0.22, ease: 'easeOut' }}
      >
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
          <TextArea
            label="Descripción"
            name="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
          <Select
            label="Estado del objeto"
            name="estadoObjeto"
            value={estadoObjeto}
            onChange={(e) => setEstadoObjeto(e.target.value as EstadoObjeto)}
            opciones={ESTADOS_OBJETO}
            required
          />
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
        </>
      ) : null}

      {paso === 3 ? (
        <div>
          <p>Agrega fotos del objeto (se suben al publicar).</p>
          <p className="aviso-info">Las publicaciones con foto se notan más en el listado — agrega al menos una si puedes.</p>
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
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={agregarArchivos} />
        </div>
      ) : null}

      {paso === 4 ? (
        <>
          <p className="aviso-info">
            Si marcas esta opción, quien reciba la donación verá tu ubicación para coordinar el retiro. Si no la marcas,
            van a ponerse de acuerdo por chat una vez publicada.
          </p>
          <label>
            <input type="checkbox" checked={requiereRetiro} onChange={(e) => setRequiereRetiro(e.target.checked)} />
            {' '}Requiere que lo retiren en mi ubicación
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
        <div>
          <h2>Revisión</h2>
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
      </motion.div>
      </AnimatePresence>

      <div className="wizard__acciones">
        <Button type="button" variant="secundario" onClick={atras} disabled={paso === 1}>
          Atrás
        </Button>
        {paso < TOTAL_PASOS ? (
          <Button type="button" onClick={siguiente} disabled={!puedeAvanzar}>
            Siguiente
          </Button>
        ) : (
          <Button type="button" onClick={publicar} disabled={publicando || !puedeAvanzar}>
            {publicando ? 'Publicando…' : 'Publicar'}
          </Button>
        )}
        {paso === 4 && requiereRetiro && !puedeAvanzar ? (
          <p className="form-field__error">Completa provincia y ciudad para continuar.</p>
        ) : null}
      </div>
    </div>
  );
}
