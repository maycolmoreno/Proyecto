import { useRef, useState } from 'react';
import { subirACloudinary, type FirmaSubida } from '@shared/lib/cloudinary';
import { Button } from '@shared/components/atoms/Button';

// Componente reutilizable (ADR-045): selector + preview + validación antes de firmar subida
// (Fase 4, sección 5). `onFirmar`/`onRegistrar` se inyectan por props — el dominio (Donación,
// Solicitud, Trueque) decide a qué endpoint pegarle; este componente no importa ningún api client.
const MIME_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

interface ImageUploaderProps {
  imagenes: string[];
  onFirmar: (mimeType: string, tamanoBytes: number) => Promise<FirmaSubida>;
  onRegistrar: (url: string, publicId: string) => Promise<void>;
}

export function ImageUploader({ imagenes, onFirmar, onRegistrar }: ImageUploaderProps): JSX.Element {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function manejarSeleccion(evento: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    if (!MIME_TYPES_PERMITIDOS.includes(archivo.type)) {
      setError('Formato no permitido. Usa JPEG, PNG o WEBP.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      setError('La imagen supera el límite de 5 MB.');
      return;
    }

    setError(null);
    setSubiendo(true);
    try {
      const firma = await onFirmar(archivo.type, archivo.size);
      const resultado = await subirACloudinary(firma, archivo);
      await onRegistrar(resultado.url, resultado.publicId);
    } catch {
      setError('No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="image-uploader">
      <div className="image-uploader__grid">
        {imagenes.map((url) => (
          <img key={url} src={url} alt="" className="image-uploader__miniatura" />
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={MIME_TYPES_PERMITIDOS.join(',')}
        onChange={manejarSeleccion}
        disabled={subiendo}
        style={{ display: 'none' }}
      />
      <Button type="button" variant="secundario" onClick={() => inputRef.current?.click()} disabled={subiendo}>
        {subiendo ? 'Subiendo…' : '+ Agregar foto'}
      </Button>
      {error ? (
        <p role="alert" className="form-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
