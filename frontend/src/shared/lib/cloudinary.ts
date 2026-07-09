// Subida directa a Cloudinary (ADR-009) — el backend nunca recibe el binario, solo firma la subida.
export interface FirmaSubida {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

export interface ResultadoSubidaCloudinary {
  url: string;
  publicId: string;
}

export async function subirACloudinary(firma: FirmaSubida, archivo: File): Promise<ResultadoSubidaCloudinary> {
  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('api_key', firma.apiKey);
  formData.append('timestamp', String(firma.timestamp));
  formData.append('signature', firma.signature);
  formData.append('upload_preset', firma.uploadPreset);
  formData.append('folder', firma.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('No se pudo subir la imagen. Intenta de nuevo.');
  }

  const body = (await response.json()) as { secure_url: string; public_id: string };
  return { url: body.secure_url, publicId: body.public_id };
}
