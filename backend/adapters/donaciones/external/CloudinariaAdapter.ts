import { createHash } from 'node:crypto';
import type { FirmaSubida, FirmarSubidaInput, ICloudStorage } from '@domain/donaciones/ports/ICloudStorage.js';

export class CloudinaryNoConfiguradoError extends Error {
  constructor() {
    super('El servicio de almacenamiento de imágenes no está configurado.');
    this.name = 'CloudinaryNoConfiguradoError';
  }
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

/** Adaptador de salida (ADR-009) — firma de subida directa a Cloudinary, el backend nunca recibe el binario. */
export class CloudinariaAdapter implements ICloudStorage {
  constructor(private readonly config: CloudinaryConfig) {}

  firmarSubida(input: FirmarSubidaInput): FirmaSubida {
    if (!this.config.cloudName || !this.config.apiKey || !this.config.apiSecret || !this.config.uploadPreset) {
      throw new CloudinaryNoConfiguradoError();
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `donaconnect/${input.tipoEntidad.toLowerCase()}/${input.idEntidad}`;

    // Firma Cloudinary: sha1(paramsOrdenadosAlfabéticamente + apiSecret). No incluye api_key/signature/file.
    const paramsParaFirmar = `folder=${folder}&timestamp=${timestamp}&upload_preset=${this.config.uploadPreset}`;
    const signature = createHash('sha1').update(paramsParaFirmar + this.config.apiSecret).digest('hex');

    return {
      signature,
      timestamp,
      apiKey: this.config.apiKey,
      cloudName: this.config.cloudName,
      uploadPreset: this.config.uploadPreset,
      folder,
    };
  }
}
