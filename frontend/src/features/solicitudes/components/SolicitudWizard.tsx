import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from '@shared/components/molecules/Stepper';
import { Input } from '@shared/components/atoms/Input';
import { TextArea } from '@shared/components/atoms/TextArea';
import { Select } from '@shared/components/atoms/Select';
import { Button } from '@shared/components/atoms/Button';
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

export function SolicitudWizard(): JSX.Element {
  const [paso, setPaso] = useState(1);
  const [categoriaId, setCategoriaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [urgencia, setUrgencia] = useState<Urgencia>('MEDIA');
  const [evidenciaUrl, setEvidenciaUrl] = useState('');
  const [ubicacion, setUbicacion] = useState<UbicacionInput>(UBICACION_VACIA);
  const [sugerencia, setSugerencia] = useState<{
    categoriaSugerida: string;
    tituloSugerido: string;
    descripcionSugerida: string;
    prioridadSugerida: string | null;
  } | null>(null);
  const [sugerenciaAplicada, setSugerenciaAplicada] = useState(false);

  const sesion = useSesion();
  const categorias = useCategorias();
  const crearSolicitud = useCrearSolicitud();
  const clasificar = useClasificar();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

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
    const categoria = (categorias.data ?? []).find((c) => c.nombre === sugerencia.categoriaSugerida);
    if (categoria) setCategoriaId(categoria.id);
    setTitulo(sugerencia.tituloSugerido);
    setDescripcion(sugerencia.descripcionSugerida);
    if (sugerencia.prioridadSugerida) setUrgencia(sugerencia.prioridadSugerida as Urgencia);
    setSugerenciaAplicada(true);
  }

  function siguiente(): void {
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  }

  function atras(): void {
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

  const etiquetasPaso = ['Categoría y título', 'Descripción y urgencia', 'Evidencia', 'Ubicación', 'Revisión'];

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
    <div className="wizard">
      <Stepper pasoActual={paso} totalPasos={TOTAL_PASOS} etiqueta={etiquetasPaso[paso - 1]!} />

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
            label="Urgencia"
            name="urgencia"
            value={urgencia}
            onChange={(e) => setUrgencia(e.target.value as Urgencia)}
            opciones={OPCIONES_URGENCIA}
            required
          />
        </>
      ) : null}

      {paso === 3 ? (
        <Input
          label="Enlace de evidencia (opcional)"
          name="evidenciaUrl"
          type="url"
          placeholder="https://…"
          value={evidenciaUrl}
          onChange={(e) => setEvidenciaUrl(e.target.value)}
        />
      ) : null}

      {paso === 4 ? (
        <SelectorUbicacion value={ubicacion} onChange={setUbicacion} ubicacionRegistrada={sesion.data?.ubicacion ?? null} />
      ) : null}

      {paso === 5 ? (
        <div>
          <h2>Revisión</h2>
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

      <div className="wizard__acciones">
        <Button type="button" variant="secundario" onClick={atras} disabled={paso === 1}>
          Atrás
        </Button>
        {paso < TOTAL_PASOS ? (
          <Button type="button" onClick={siguiente} disabled={!puedeAvanzar}>
            Siguiente
          </Button>
        ) : (
          <Button type="button" onClick={publicar} disabled={crearSolicitud.isPending || !puedeAvanzar}>
            {crearSolicitud.isPending ? 'Publicando…' : 'Publicar'}
          </Button>
        )}
        {paso === 4 && !puedeAvanzar ? <p className="form-field__error">Completa provincia y ciudad para continuar.</p> : null}
      </div>
    </div>
  );
}
