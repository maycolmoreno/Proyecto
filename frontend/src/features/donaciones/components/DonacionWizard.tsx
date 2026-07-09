import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from '@shared/components/molecules/Stepper';
import { Input } from '@shared/components/atoms/Input';
import { TextArea } from '@shared/components/atoms/TextArea';
import { Select } from '@shared/components/atoms/Select';
import { Button } from '@shared/components/atoms/Button';
import { LocationPicker } from '@shared/components/molecules/LocationPicker';
import { subirACloudinary } from '@shared/lib/cloudinary';
import { useToast } from '@shared/components/organisms/ToastProvider';
import type { UbicacionInput } from '@shared/lib/ubicacion';
import { useCategorias } from '@features/categorias/hooks/useCategorias';
import { useCrearDonacion } from '../hooks/useCrearDonacion.js';
import { donacionesApi } from '../api/donaciones.api.js';
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

export function DonacionWizard(): JSX.Element {
  const [paso, setPaso] = useState(1);
  const [categoriaId, setCategoriaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estadoObjeto, setEstadoObjeto] = useState<EstadoObjeto>('BUEN_ESTADO');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [requiereRetiro, setRequiereRetiro] = useState(false);
  const [ubicacionRetiro, setUbicacionRetiro] = useState<UbicacionInput>(UBICACION_VACIA);
  const [publicando, setPublicando] = useState(false);

  const categorias = useCategorias();
  const crearDonacion = useCrearDonacion();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  function siguiente(): void {
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  }

  function atras(): void {
    setPaso((p) => Math.max(p - 1, 1));
  }

  function agregarArchivos(evento: React.ChangeEvent<HTMLInputElement>): void {
    const nuevos = Array.from(evento.target.files ?? []);
    setArchivos((actuales) => [...actuales, ...nuevos]);
    evento.target.value = '';
  }

  async function publicar(): Promise<void> {
    setPublicando(true);
    try {
      const donacion = await crearDonacion.mutateAsync({
        titulo,
        descripcion,
        categoriaId,
        estadoObjeto,
        requiereRetiro,
        ubicacionRetiro: requiereRetiro ? ubicacionRetiro : undefined,
      });

      for (const archivo of archivos) {
        const firma = await donacionesApi.firmarImagen(donacion.id, archivo.type, archivo.size);
        const resultado = await subirACloudinary(firma, archivo);
        await donacionesApi.registrarImagen(donacion.id, resultado.url, resultado.publicId);
      }

      mostrarToast('Donación publicada con éxito.', 'exito');
      navigate(`/donaciones/${donacion.id}`);
    } catch {
      mostrarToast('No se pudo publicar la donación. Intenta de nuevo.', 'error');
    } finally {
      setPublicando(false);
    }
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
          <label>
            <input type="checkbox" checked={requiereRetiro} onChange={(e) => setRequiereRetiro(e.target.checked)} />
            {' '}Requiere que lo retiren en mi ubicación
          </label>
          {requiereRetiro ? <LocationPicker value={ubicacionRetiro} onChange={setUbicacionRetiro} /> : null}
        </>
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
          {requiereRetiro ? (
            <p>
              Retiro en: {ubicacionRetiro.ciudad}, {ubicacionRetiro.provincia}
            </p>
          ) : null}
          {/* Sugerencia de IA (RF-015) se conecta en el Sprint F4 — IASuggestionBox. */}
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
