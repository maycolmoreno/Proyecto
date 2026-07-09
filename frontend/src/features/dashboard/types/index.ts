// Tipos del dominio de Dashboard — espejo de DashboardImpacto (CU-012/RF-019, Fase 4).
export interface DashboardImpacto {
  donaciones: { publicadas: number; entregadas: number };
  solicitudes: { abiertas: number; atendidas: number };
  trueques: { publicados: number; intercambiados: number };
  usuarios: { donantes: number; beneficiarios: number; usuariosComunidad: number };
  eventosClave: { solicitudAtendida: number; truequeIntercambiado: number; entregaConfirmada: number };
}
