export const URGENCIAS = ['BAJA', 'MEDIA', 'ALTA'] as const;
export type Urgencia = (typeof URGENCIAS)[number];
