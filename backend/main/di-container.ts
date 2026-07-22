import './mongoose-connection.js';
import { prisma } from './prisma-client.js';
import { env } from './env.js';
import { eventBus } from './event-bus.js';
import { PrismaUsuarioRepository } from '@adapters/identidad/repositories/PrismaUsuarioRepository.js';
import { PrismaUsuarioPerfilRepository } from '@adapters/identidad/repositories/PrismaUsuarioPerfilRepository.js';
import { BcryptPasswordHasher } from '@adapters/identidad/security/BcryptPasswordHasher.js';
import { JwtTokenService } from '@adapters/identidad/security/JwtTokenService.js';
import { RegistrarUsuarioUseCase } from '@application/identidad/use-cases/RegistrarUsuarioUseCase.js';
import { IniciarSesionUseCase } from '@application/identidad/use-cases/IniciarSesionUseCase.js';
import { ObtenerPerfilUseCase } from '@application/identidad/use-cases/ObtenerPerfilUseCase.js';
import { ObtenerUsuarioPublicoUseCase } from '@application/identidad/use-cases/ObtenerUsuarioPublicoUseCase.js';
import { AsignarPerfilesUseCase } from '@application/identidad/use-cases/AsignarPerfilesUseCase.js';
import { ActualizarUbicacionPerfilUseCase } from '@application/identidad/use-cases/ActualizarUbicacionPerfilUseCase.js';
import { PrismaUbicacionPerfilRepository } from '@adapters/identidad/repositories/PrismaUbicacionPerfilRepository.js';
import { AuthController } from '@adapters/identidad/controllers/auth.controller.js';
import { UsuariosController } from '@adapters/identidad/controllers/usuarios.controller.js';

import { PrismaCategoriaRepository } from '@adapters/categorias/repositories/PrismaCategoriaRepository.js';
import { CrearCategoriaUseCase } from '@application/categorias/use-cases/CrearCategoriaUseCase.js';
import { ListarCategoriasUseCase } from '@application/categorias/use-cases/ListarCategoriasUseCase.js';
import { ActualizarCategoriaUseCase } from '@application/categorias/use-cases/ActualizarCategoriaUseCase.js';
import { CategoriasController } from '@adapters/categorias/controllers/categorias.controller.js';

import { PrismaDonacionRepository } from '@adapters/donaciones/repositories/PrismaDonacionRepository.js';
import { PrismaUbicacionRetiroRepository } from '@adapters/donaciones/repositories/PrismaUbicacionRetiroRepository.js';
import { PrismaImagenRepository } from '@adapters/donaciones/repositories/PrismaImagenRepository.js';
import { CloudinariaAdapter } from '@adapters/donaciones/external/CloudinariaAdapter.js';
import { PublicarDonacionUseCase } from '@application/donaciones/use-cases/PublicarDonacionUseCase.js';
import { ListarDonacionesUseCase } from '@application/donaciones/use-cases/ListarDonacionesUseCase.js';
import { ObtenerDonacionUseCase } from '@application/donaciones/use-cases/ObtenerDonacionUseCase.js';
import { ActualizarDonacionUseCase } from '@application/donaciones/use-cases/ActualizarDonacionUseCase.js';
import { CancelarDonacionUseCase } from '@application/donaciones/use-cases/CancelarDonacionUseCase.js';
import { FirmarSubidaImagenUseCase } from '@application/donaciones/use-cases/FirmarSubidaImagenUseCase.js';
import { RegistrarImagenUseCase } from '@application/donaciones/use-cases/RegistrarImagenUseCase.js';
import { DonacionesController } from '@adapters/donaciones/controllers/donaciones.controller.js';

import { PrismaAuditoriaRepository } from '@adapters/auditoria/repositories/PrismaAuditoriaRepository.js';

import { PrismaSolicitudRepository } from '@adapters/solicitudes/repositories/PrismaSolicitudRepository.js';
import { PrismaUbicacionSolicitudRepository } from '@adapters/solicitudes/repositories/PrismaUbicacionSolicitudRepository.js';
import { CrearSolicitudUseCase } from '@application/solicitudes/use-cases/CrearSolicitudUseCase.js';
import { ListarSolicitudesUseCase } from '@application/solicitudes/use-cases/ListarSolicitudesUseCase.js';
import { ObtenerSolicitudUseCase } from '@application/solicitudes/use-cases/ObtenerSolicitudUseCase.js';
import { ActualizarSolicitudUseCase } from '@application/solicitudes/use-cases/ActualizarSolicitudUseCase.js';
import { CrearOfertaUseCase } from '@application/solicitudes/use-cases/CrearOfertaUseCase.js';
import { ActualizarOfertaUseCase } from '@application/solicitudes/use-cases/ActualizarOfertaUseCase.js';
import { SolicitudesController } from '@adapters/solicitudes/controllers/solicitudes.controller.js';

import { PrismaEntregaRepository } from '@adapters/entregas/repositories/PrismaEntregaRepository.js';
import { EntregaCoordinacionService } from '@domain/entregas/services/EntregaCoordinacionService.js';
import { EntregaCierreOrigenService } from '@domain/entregas/services/EntregaCierreOrigenService.js';
import { EntregaAutorizacionService } from '@application/entregas/services/EntregaAutorizacionService.js';
import { ObtenerEntregaUseCase } from '@application/entregas/use-cases/ObtenerEntregaUseCase.js';
import { ActualizarEntregaUseCase } from '@application/entregas/use-cases/ActualizarEntregaUseCase.js';
import { EntregasController } from '@adapters/entregas/controllers/entregas.controller.js';

import { PrismaTruequeRepository } from '@adapters/trueques/repositories/PrismaTruequeRepository.js';
import { PrismaImagenRepository as PrismaImagenRepositoryTrueque } from '@adapters/trueques/repositories/PrismaImagenRepository.js';
import { PublicarTruequeUseCase } from '@application/trueques/use-cases/PublicarTruequeUseCase.js';
import { ListarTruequesUseCase } from '@application/trueques/use-cases/ListarTruequesUseCase.js';
import { ObtenerTruequeUseCase } from '@application/trueques/use-cases/ObtenerTruequeUseCase.js';
import { ActualizarTruequeUseCase } from '@application/trueques/use-cases/ActualizarTruequeUseCase.js';
import { ProponerTruequeUseCase } from '@application/trueques/use-cases/ProponerTruequeUseCase.js';
import { ResponderPropuestaUseCase } from '@application/trueques/use-cases/ResponderPropuestaUseCase.js';
import { FirmarSubidaImagenUseCase as FirmarSubidaImagenTruequeUseCase } from '@application/trueques/use-cases/FirmarSubidaImagenUseCase.js';
import { RegistrarImagenUseCase as RegistrarImagenTruequeUseCase } from '@application/trueques/use-cases/RegistrarImagenUseCase.js';
import { TruequesController } from '@adapters/trueques/controllers/trueques.controller.js';

import { MongooseConversacionRepository } from '@adapters/mensajeria/repositories/MongooseConversacionRepository.js';
import { EnviarMensajeUseCase } from '@application/mensajeria/use-cases/EnviarMensajeUseCase.js';
import { ListarConversacionesUseCase } from '@application/mensajeria/use-cases/ListarConversacionesUseCase.js';
import { ListarMensajesUseCase } from '@application/mensajeria/use-cases/ListarMensajesUseCase.js';
import { MensajeriaController } from '@adapters/mensajeria/controllers/mensajeria.controller.js';

import { GeminiAdapter } from '@adapters/ia/external/GeminiAdapter.js';
import { MongooseConversacionChatbotRepository } from '@adapters/ia/repositories/MongooseConversacionChatbotRepository.js';
import { MongooseAnalisisIARepository } from '@adapters/ia/repositories/MongooseAnalisisIARepository.js';
import { ChatbotOrquestacionService } from '@domain/ia/services/ChatbotOrquestacionService.js';
import { ClasificacionService } from '@domain/ia/services/ClasificacionService.js';
import { MatchingService } from '@domain/ia/services/MatchingService.js';
import { ModeracionIAService } from '@domain/ia/services/ModeracionIAService.js';
import { ChatearUseCase } from '@application/ia/use-cases/ChatearUseCase.js';
import { ObtenerConversacionUseCase } from '@application/ia/use-cases/ObtenerConversacionUseCase.js';
import { ClasificarUseCase } from '@application/ia/use-cases/ClasificarUseCase.js';
import { ObtenerMatchesUseCase } from '@application/ia/use-cases/ObtenerMatchesUseCase.js';
import { IaController } from '@adapters/ia/controllers/ia.controller.js';

import { ModeracionService } from '@domain/administracion/services/ModeracionService.js';
import { ModerarPublicacionUseCase } from '@application/administracion/use-cases/ModerarPublicacionUseCase.js';
import { ModerarUsuarioUseCase } from '@application/administracion/use-cases/ModerarUsuarioUseCase.js';
import { ObtenerReportesUseCase } from '@application/administracion/use-cases/ObtenerReportesUseCase.js';
import { ListarUsuariosUseCase } from '@application/administracion/use-cases/ListarUsuariosUseCase.js';
import { AdminController } from '@adapters/administracion/controllers/admin.controller.js';

import { MongooseNotificacionRepository } from '@adapters/notificaciones/repositories/MongooseNotificacionRepository.js';
import { MongooseEventoSistemaRepository } from '@adapters/notificaciones/repositories/MongooseEventoSistemaRepository.js';
import { NotificacionDispatchService } from '@domain/notificaciones/services/NotificacionDispatchService.js';
import { ListarNotificacionesUseCase } from '@application/notificaciones/use-cases/ListarNotificacionesUseCase.js';
import { MarcarLeidoUseCase } from '@application/notificaciones/use-cases/MarcarLeidoUseCase.js';
import { NotificacionesController } from '@adapters/notificaciones/controllers/notificaciones.controller.js';

import { DashboardQueryService } from '@domain/dashboard/services/DashboardQueryService.js';
import { ObtenerDashboardImpactoUseCase } from '@application/dashboard/use-cases/ObtenerDashboardImpactoUseCase.js';
import { DashboardController } from '@adapters/dashboard/controllers/dashboard.controller.js';

import { MongoosePublicacionIndexRepository } from '@adapters/publicaciones/repositories/MongoosePublicacionIndexRepository.js';
import { PublicacionIndexService } from '@domain/publicaciones/services/PublicacionIndexService.js';
import { ListarMisPublicacionesUseCase } from '@application/publicaciones/use-cases/ListarMisPublicacionesUseCase.js';
import { PublicacionesController } from '@adapters/publicaciones/controllers/publicaciones.controller.js';

// Composition root (Clean Architecture, capa Frameworks & Drivers) — único lugar
// que decide qué adaptador concreto se inyecta en cada caso de uso (ADR-042/044).

// Auditoría (RNF-006, transversal — Fase 9 sección 3)
const auditoriaRepository = new PrismaAuditoriaRepository(prisma);

// BC-Identidad
const usuarioRepository = new PrismaUsuarioRepository(prisma);
// Opción D (docs/DISENO_MODELO_PERFILES.md) — usuarios_perfiles, independiente de rol.
const usuarioPerfilRepository = new PrismaUsuarioPerfilRepository(prisma);
// Ubicación de perfil (tipo PERFIL) — cierra el gap de PerfilPage.tsx tab "Ubicación".
const ubicacionPerfilRepository = new PrismaUbicacionPerfilRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService(env.JWT_SECRET);

const registrarUsuarioUseCase = new RegistrarUsuarioUseCase(
  usuarioRepository,
  passwordHasher,
  eventBus,
  usuarioPerfilRepository,
);
const iniciarSesionUseCase = new IniciarSesionUseCase(
  usuarioRepository,
  passwordHasher,
  tokenService,
  auditoriaRepository,
  usuarioPerfilRepository,
);
const obtenerPerfilUseCase = new ObtenerPerfilUseCase(
  usuarioRepository,
  usuarioPerfilRepository,
  ubicacionPerfilRepository,
);
const obtenerUsuarioPublicoUseCase = new ObtenerUsuarioPublicoUseCase(usuarioRepository);
const asignarPerfilesUseCase = new AsignarPerfilesUseCase(usuarioPerfilRepository);
const actualizarUbicacionPerfilUseCase = new ActualizarUbicacionPerfilUseCase(ubicacionPerfilRepository);

export const authController = new AuthController(registrarUsuarioUseCase, iniciarSesionUseCase);
export const usuariosController = new UsuariosController(
  obtenerPerfilUseCase,
  obtenerUsuarioPublicoUseCase,
  asignarPerfilesUseCase,
  actualizarUbicacionPerfilUseCase,
);

// BC-Categorías (Shared Kernel)
const categoriaRepository = new PrismaCategoriaRepository(prisma);

const crearCategoriaUseCase = new CrearCategoriaUseCase(categoriaRepository);
const listarCategoriasUseCase = new ListarCategoriasUseCase(categoriaRepository);
const actualizarCategoriaUseCase = new ActualizarCategoriaUseCase(categoriaRepository);

export const categoriasController = new CategoriasController(
  crearCategoriaUseCase,
  listarCategoriasUseCase,
  actualizarCategoriaUseCase,
);

// BC-Donaciones
const donacionRepository = new PrismaDonacionRepository(prisma);
const ubicacionRetiroRepository = new PrismaUbicacionRetiroRepository(prisma);
const imagenRepository = new PrismaImagenRepository(prisma);
const cloudStorage = new CloudinariaAdapter({
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET,
  uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
});

const publicarDonacionUseCase = new PublicarDonacionUseCase(
  donacionRepository,
  categoriaRepository,
  ubicacionRetiroRepository,
  eventBus,
);
const listarDonacionesUseCase = new ListarDonacionesUseCase(donacionRepository);
const obtenerDonacionUseCase = new ObtenerDonacionUseCase(donacionRepository);
const actualizarDonacionUseCase = new ActualizarDonacionUseCase(donacionRepository);
const cancelarDonacionUseCase = new CancelarDonacionUseCase(donacionRepository);
const firmarSubidaImagenUseCase = new FirmarSubidaImagenUseCase(donacionRepository, cloudStorage);
const registrarImagenUseCase = new RegistrarImagenUseCase(donacionRepository, imagenRepository);

export const donacionesController = new DonacionesController(
  publicarDonacionUseCase,
  listarDonacionesUseCase,
  obtenerDonacionUseCase,
  actualizarDonacionUseCase,
  cancelarDonacionUseCase,
  firmarSubidaImagenUseCase,
  registrarImagenUseCase,
);

// BC-Entregas (Supporting — consumido por Solicitudes y, desde Sprint 3, por Trueques)
const entregaRepository = new PrismaEntregaRepository(prisma);
const entregaCoordinacionService = new EntregaCoordinacionService(entregaRepository, eventBus);

// BC-Solicitudes
const solicitudRepository = new PrismaSolicitudRepository(prisma);
const ubicacionSolicitudRepository = new PrismaUbicacionSolicitudRepository(prisma);

const crearSolicitudUseCase = new CrearSolicitudUseCase(
  solicitudRepository,
  categoriaRepository,
  ubicacionSolicitudRepository,
  eventBus,
);
const listarSolicitudesUseCase = new ListarSolicitudesUseCase(solicitudRepository);
const obtenerSolicitudUseCase = new ObtenerSolicitudUseCase(solicitudRepository);
const actualizarSolicitudUseCase = new ActualizarSolicitudUseCase(solicitudRepository);
const crearOfertaUseCase = new CrearOfertaUseCase(
  solicitudRepository,
  donacionRepository,
  entregaCoordinacionService,
  eventBus,
);
const actualizarOfertaUseCase = new ActualizarOfertaUseCase(solicitudRepository, donacionRepository);

export const solicitudesController = new SolicitudesController(
  crearSolicitudUseCase,
  listarSolicitudesUseCase,
  obtenerSolicitudUseCase,
  actualizarSolicitudUseCase,
  crearOfertaUseCase,
  actualizarOfertaUseCase,
);

// BC-Trueques
const truequeRepository = new PrismaTruequeRepository(prisma);
const imagenRepositoryTrueque = new PrismaImagenRepositoryTrueque(prisma);

const publicarTruequeUseCase = new PublicarTruequeUseCase(truequeRepository, categoriaRepository, eventBus);
const listarTruequesUseCase = new ListarTruequesUseCase(truequeRepository);
const obtenerTruequeUseCase = new ObtenerTruequeUseCase(truequeRepository);
const actualizarTruequeUseCase = new ActualizarTruequeUseCase(truequeRepository);
const proponerTruequeUseCase = new ProponerTruequeUseCase(truequeRepository, eventBus);
const responderPropuestaUseCase = new ResponderPropuestaUseCase(truequeRepository, entregaCoordinacionService, eventBus);
const firmarSubidaImagenTruequeUseCase = new FirmarSubidaImagenTruequeUseCase(truequeRepository, cloudStorage);
const registrarImagenTruequeUseCase = new RegistrarImagenTruequeUseCase(truequeRepository, imagenRepositoryTrueque);

export const truequesController = new TruequesController(
  publicarTruequeUseCase,
  listarTruequesUseCase,
  obtenerTruequeUseCase,
  actualizarTruequeUseCase,
  proponerTruequeUseCase,
  responderPropuestaUseCase,
  firmarSubidaImagenTruequeUseCase,
  registrarImagenTruequeUseCase,
);

// BC-Mensajería (Fase 2 — MongoDB, sin Domain Service propio: la aggregate Conversación absorbe
// sus propias invariantes, Fase 2 sección 6 no lista un servicio para este contexto).
const conversacionRepository = new MongooseConversacionRepository();
const enviarMensajeUseCase = new EnviarMensajeUseCase(conversacionRepository, usuarioRepository);
const listarConversacionesUseCase = new ListarConversacionesUseCase(conversacionRepository);
const listarMensajesUseCase = new ListarMensajesUseCase(conversacionRepository);

export const mensajeriaController = new MensajeriaController(
  enviarMensajeUseCase,
  listarConversacionesUseCase,
  listarMensajesUseCase,
);

// BC-Entregas (use cases) — se construye al final porque EntregaAutorizacionService/
// EntregaCierreOrigenService necesitan donacionRepository + solicitudRepository + truequeRepository
// ya instanciados.
const entregaAutorizacionService = new EntregaAutorizacionService(
  donacionRepository,
  solicitudRepository,
  truequeRepository,
);
const entregaCierreOrigenService = new EntregaCierreOrigenService(
  donacionRepository,
  solicitudRepository,
  truequeRepository,
  eventBus,
);
const obtenerEntregaUseCase = new ObtenerEntregaUseCase(entregaRepository, entregaAutorizacionService);
const actualizarEntregaUseCase = new ActualizarEntregaUseCase(
  entregaRepository,
  entregaAutorizacionService,
  entregaCierreOrigenService,
  eventBus,
);

export const entregasController = new EntregasController(obtenerEntregaUseCase, actualizarEntregaUseCase);

// BC-IA (Fase 2/7). Adapter cableado en producción: GeminiAdapter (Sprint 5, desvía de ADR-024
// "Claude/Anthropic" por acceso a API key gratuita — ver fase-07-inteligencia-artificial.md
// historial). ClaudeAdapter sigue disponible en adapters/ia/external/ si se recupera una key de
// Anthropic válida; basta con cambiar esta línea, ambos implementan IIAProvider. IA_API_KEY puede
// estar vacía en desarrollo: el adapter degrada a IAProviderNoConfiguradoError en cada llamada
// (RNF-002, mismo patrón que CloudinariaAdapter).
const iaProvider = new GeminiAdapter(env.IA_API_KEY);
const conversacionChatbotRepository = new MongooseConversacionChatbotRepository();
const analisisIARepository = new MongooseAnalisisIARepository();

const chatbotOrquestacionService = new ChatbotOrquestacionService(iaProvider, conversacionChatbotRepository);
const clasificacionService = new ClasificacionService(iaProvider, categoriaRepository);
const matchingService = new MatchingService(iaProvider, donacionRepository, solicitudRepository, truequeRepository);
const moderacionIAService = new ModeracionIAService(iaProvider, analisisIARepository, eventBus);

const chatearUseCase = new ChatearUseCase(chatbotOrquestacionService);
const obtenerConversacionUseCase = new ObtenerConversacionUseCase(chatbotOrquestacionService);
const clasificarUseCase = new ClasificarUseCase(clasificacionService);
const obtenerMatchesUseCase = new ObtenerMatchesUseCase(matchingService);

export const iaController = new IaController(
  chatearUseCase,
  obtenerConversacionUseCase,
  clasificarUseCase,
  obtenerMatchesUseCase,
);

// BC-Administración (Fase 2, sección 6 — "Anti-corrupción/operación directa autorizada").
const moderacionService = new ModeracionService(
  usuarioRepository,
  donacionRepository,
  solicitudRepository,
  truequeRepository,
  analisisIARepository,
  eventBus,
);
const moderarPublicacionUseCase = new ModerarPublicacionUseCase(moderacionService);
const moderarUsuarioUseCase = new ModerarUsuarioUseCase(moderacionService);
const obtenerReportesUseCase = new ObtenerReportesUseCase(moderacionService);
const listarUsuariosUseCase = new ListarUsuariosUseCase(usuarioRepository);

export const adminController = new AdminController(
  moderarPublicacionUseCase,
  moderarUsuarioUseCase,
  obtenerReportesUseCase,
  listarUsuariosUseCase,
);

// Fase 7, sección 5 (ADR-027) — primer listener real del Event Bus: moderación asistida por IA,
// nunca bloquea la publicación (NodeEventBus.on ya atrapa errores del listener, main/event-bus.ts).
interface PayloadPublicacion {
  id: string;
  titulo: string;
  descripcion: string;
}
eventBus.on<PayloadPublicacion>('DonacionPublicada', (payload) =>
  moderacionIAService.evaluarYRegistrar({
    tipoEntidad: 'DONACION',
    entidadId: payload.id,
    titulo: payload.titulo,
    descripcion: payload.descripcion,
  }),
);
eventBus.on<PayloadPublicacion>('SolicitudCreada', (payload) =>
  moderacionIAService.evaluarYRegistrar({
    tipoEntidad: 'SOLICITUD',
    entidadId: payload.id,
    titulo: payload.titulo,
    descripcion: payload.descripcion,
  }),
);
eventBus.on<PayloadPublicacion>('TruequePublicado', (payload) =>
  moderacionIAService.evaluarYRegistrar({
    tipoEntidad: 'TRUEQUE',
    entidadId: payload.id,
    titulo: payload.titulo,
    descripcion: payload.descripcion,
  }),
);

// BC-Notificaciones (Fase 2, sección 6). Segundo listener real del Event Bus — se suscribe a los
// 12 eventos de dominio de Fase 6 sección 5 + RiesgoDetectado (Sprint 4). Solo canal in-app — el
// canal de correo vía n8n se removió del proyecto (2026-07-10, ver historial de fase-06-backend.md).
const notificacionRepository = new MongooseNotificacionRepository();
const eventoSistemaRepository = new MongooseEventoSistemaRepository();
const notificacionDispatchService = new NotificacionDispatchService(
  notificacionRepository,
  eventoSistemaRepository,
  donacionRepository,
  solicitudRepository,
  truequeRepository,
  usuarioRepository,
);
const listarNotificacionesUseCase = new ListarNotificacionesUseCase(notificacionRepository);
const marcarLeidoUseCase = new MarcarLeidoUseCase(notificacionRepository);
export const notificacionesController = new NotificacionesController(listarNotificacionesUseCase, marcarLeidoUseCase);

// Dashboard (CU-012/RF-019, Fase 2: "BC-Notificaciones/KPI transversal").
const dashboardQueryService = new DashboardQueryService(
  donacionRepository,
  solicitudRepository,
  truequeRepository,
  usuarioPerfilRepository,
  eventoSistemaRepository,
);
const obtenerDashboardImpactoUseCase = new ObtenerDashboardImpactoUseCase(dashboardQueryService);
export const dashboardController = new DashboardController(obtenerDashboardImpactoUseCase);

// BC-Publicaciones (Fase 5 diferida, docs/DISENO_MODELO_PERFILES.md sección 7). Tercer listener
// real del Event Bus — proyección de solo lectura "Mis publicaciones", coexiste con los listeners
// de ModeracionIAService/NotificacionDispatchService sobre los mismos 3 eventos de creación.
const publicacionIndexRepository = new MongoosePublicacionIndexRepository();
const publicacionIndexService = new PublicacionIndexService(publicacionIndexRepository);
const listarMisPublicacionesUseCase = new ListarMisPublicacionesUseCase(publicacionIndexRepository);
export const publicacionesController = new PublicacionesController(listarMisPublicacionesUseCase);

eventBus.on<{ id: string; titulo: string; donanteId: string; estadoDonacion: string }>('DonacionPublicada', (p) =>
  publicacionIndexService.alDonacionPublicada(p),
);
eventBus.on<{ id: string; titulo: string; beneficiarioId: string; estadoSolicitud: string }>('SolicitudCreada', (p) =>
  publicacionIndexService.alSolicitudCreada(p),
);
eventBus.on<{ id: string; titulo: string; usuarioId: string; estadoTrueque: string }>('TruequePublicado', (p) =>
  publicacionIndexService.alTruequePublicado(p),
);
eventBus.on<{ id: string }>('SolicitudAceptadaPorDonante', (p) => publicacionIndexService.alSolicitudAceptadaPorDonante(p));
eventBus.on<{ id: string }>('SolicitudAtendida', (p) => publicacionIndexService.alSolicitudAtendida(p));
eventBus.on<{ truequeOrigenId: string; truequeOfrecidoId: string }>('TruequeAceptadoBilateralmente', (p) =>
  publicacionIndexService.alTruequeAceptadoBilateralmente(p),
);
eventBus.on<{ id: string }>('TruequeIntercambiado', (p) => publicacionIndexService.alTruequeIntercambiado(p));

eventBus.on<{ id: string; nombre: string }>('UsuarioRegistrado', (p) => notificacionDispatchService.alUsuarioRegistrado(p));
eventBus.on<{ id: string; titulo: string; donanteId: string }>('DonacionPublicada', (p) =>
  notificacionDispatchService.alDonacionPublicada(p),
);
eventBus.on<{ solicitudId: string; beneficiarioId: string }>('OfertaRecibida', (p) =>
  notificacionDispatchService.alOfertaRecibida(p),
);
eventBus.on<{ id: string; beneficiarioId: string }>('SolicitudAceptadaPorDonante', (p) =>
  notificacionDispatchService.alSolicitudAceptadaPorDonante(p),
);
eventBus.on<{ id: string; beneficiarioId: string }>('SolicitudAtendida', (p) =>
  notificacionDispatchService.alSolicitudAtendida(p),
);
eventBus.on<{ id: string; titulo: string; usuarioId: string }>('TruequePublicado', (p) =>
  notificacionDispatchService.alTruequePublicado(p),
);
eventBus.on<{ truequeOrigenId: string; dueñoOrigenId: string }>('PropuestaTruequeRecibida', (p) =>
  notificacionDispatchService.alPropuestaTruequeRecibida(p),
);
eventBus.on<{ truequeOrigenId: string; dueñoOrigenId: string; proponenteId: string }>(
  'TruequeAceptadoBilateralmente',
  (p) => notificacionDispatchService.alTruequeAceptadoBilateralmente(p),
);
eventBus.on<{ id: string; usuarioId: string }>('TruequeIntercambiado', (p) =>
  notificacionDispatchService.alTruequeIntercambiado(p),
);
eventBus.on<{ id: string; idReferencia: string; tipoOperacion: 'DONACION' | 'TRUEQUE' }>('EntregaProgramada', (p) =>
  notificacionDispatchService.alEntregaProgramada(p),
);
eventBus.on<{ id: string; idReferencia: string; tipoOperacion: 'DONACION' | 'TRUEQUE' }>('EntregaConfirmada', (p) =>
  notificacionDispatchService.alEntregaConfirmada(p),
);
eventBus.on<{ tipoEntidad: 'DONACION' | 'SOLICITUD' | 'TRUEQUE'; entidadId: string; accion: string }>(
  'PublicacionModerada',
  (p) => notificacionDispatchService.alPublicacionModerada(p),
);
eventBus.on<{ tipoEntidad: 'DONACION' | 'SOLICITUD' | 'TRUEQUE'; entidadId: string }>('RiesgoDetectado', (p) =>
  notificacionDispatchService.alRiesgoDetectado(p),
);

// Exportado para inyectar en middlewares transversales (ver main/middlewares/auth.middleware.ts, audit.middleware.ts).
export const container = { tokenService, auditoriaRepository };
