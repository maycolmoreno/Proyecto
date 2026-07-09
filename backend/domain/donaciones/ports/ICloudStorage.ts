export interface FirmarSubidaInput {
  tipoEntidad: 'DONACION' | 'SOLICITUD' | 'TRUEQUE';
  idEntidad: string;
  mimeType: string;
  tamanoBytes: number;
}

export interface FirmaSubida {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadPreset: string;
  folder: string;
}

export class ArchivoInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ArchivoInvalidoError';
  }
}

/** Puerto de salida (ADR-009) — implementado en adapters/external/CloudinariaAdapter. */
export interface ICloudStorage {
  firmarSubida(input: FirmarSubidaInput): FirmaSubida;
}
