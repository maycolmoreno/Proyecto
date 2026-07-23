import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Stepper } from '@shared/components/molecules/Stepper';
import { Input } from '@shared/components/atoms/Input';
import { TextArea } from '@shared/components/atoms/TextArea';
import { Select } from '@shared/components/atoms/Select';
import { Button } from '@shared/components/atoms/Button';
import { IASuggestionBox } from '@shared/components/molecules/IASuggestionBox';
import { subirACloudinary } from '@shared/lib/cloudinary';
import { useToast } from '@shared/components/organisms/ToastProvider';
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

  const etiquetasPaso = ['Categoría y título', 'Descripción y estado', 'Fotos', '¿Qué buscas a cambio?', 'Revisión'];

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
        className="wizard"
        initial={prefiereReducirMovimiento ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h2>¡Trueque publicado con éxito!</h2>
        <p>Buscamos otros trueques publicados que podrían interesarte para intercambiar.</p>
        {matches.isLoading ? <p className="estado-lista">Buscando coincidencias…</p> : null}
        {matches.isError ? (
          <p className="estado-lista">No se pudieron cargar las coincidencias sugeridas. Podés verlas más tarde desde tu trueque.</p>
        ) : null}
        {!matches.isLoading && !matches.isError && matches.items.length === 0 ? (
          <p className="estado-lista">Por ahora no encontramos coincidencias. Te avisaremos si aparece alguna.</p>
        ) : null}
        <MatchesSugeridos entidadTipo="TRUEQUE" entidadId={truequePublicado.id} />
        <div className="wizard__acciones">
          <Button type="button" onClick={() => navigate(`/trueques/${truequePublicado.id}`)}>
            Ver mi trueque
          </Button>
        </div>
      </motion.div>
    );
  }

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
        <div>
          <h2>Revisión</h2>
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
      </div>
    </div>
  );
}
