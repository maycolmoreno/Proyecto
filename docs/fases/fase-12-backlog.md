# Fase 12 — Backlog

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** Fases 0-11 completas (última fase del Plan Maestro)

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. 11 épicas, ~29 features (1:1 con los RF/capacidades ya diseñados), historias de usuario, desglose de tareas por feature (backend/frontend/test/IA/infra) con estimación en días-persona referenciales, y prioridad MoSCoW heredada de Fase -1. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Plan Maestro completo (Fase -1 a Fase 12) cerrado. |

---

## Cómo leer este backlog

- **Estimaciones en días-persona**, referenciales — asumen un desarrollador trabajando el feature de punta a punta; deben escalarse según el tamaño real del equipo. La suma aproximada por sprint es orientativa frente a los 5 días hábiles/sprint de Fase 11, no una promesa exacta.
- **Prioridad** hereda la clasificación MoSCoW de Fase -1: **M**ust (16 RF core), **S**hould (RF-016/017/019/020 + moderación IA), **W**on't (fuera de alcance, no aparece aquí).
- Cada Feature = 1 RF/capacidad ya trazada en fases anteriores — no se inventa alcance nuevo aquí, solo se descompone en unidades ejecutables.

---

## EPIC-11 — Infraestructura y DevOps (transversal, Sprint 0)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-11.1 Docker Compose | Como desarrollador, quiero levantar todo el stack con un comando para desarrollar de forma reproducible. | • Dockerfiles (web, api) • `docker-compose.yml` (red, volúmenes, healthchecks) • `.env.example` completo (Fase 10) | 1.5 | M |
| FEAT-11.2 CI Pipeline | Como desarrollador, quiero que cada push valide lint/typecheck/test/build. | • Workflow GitHub Actions • Configuración ESLint/tsc | 0.5 | M |
| FEAT-11.3 Seguridad transversal base | Como arquitecto, quiero los middlewares de seguridad listos antes de construir features. | • `authMiddleware` (JWT) • `rbacMiddleware` • `errorHandlerMiddleware` (envelope, ADR-018) • `auditMiddleware` • Rate limiter global | 1.5 | M |

---

## EPIC-01 — Identidad y Acceso (Sprint 0)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-01.1 Registro (RF-001) | Como usuario, quiero registrarme con nombre, correo, contraseña y rol. | • Endpoint + validación Zod • `UsuarioRepository.crear` + bcrypt • Evento `UsuarioRegistrado` • Formulario de registro (frontend) | 1 | M |
| FEAT-01.2 Login (RF-002) | Como usuario, quiero iniciar sesión y recibir un token. | • Endpoint + verificación bcrypt • `AutenticacionService.generarToken` • Formulario de login + guardado en `sessionStorage` (ADR-032) | 0.5 | M |
| FEAT-01.3 Gestión de roles (RF-003) | Como sistema, quiero aplicar la matriz RBAC (ADR-016) en cada endpoint mutable. | • Aplicar `rbacMiddleware` a las rutas de Fase 4 • Ocultar/mostrar acciones en UI según rol | 0.5 | M |
| FEAT-01.4 Perfil y ubicación (RF-004) | Como beneficiario, quiero registrar mi ubicación establecida y necesidades. | • Endpoint `PATCH /usuarios/me` • `UbicacionRepository` • Formulario de perfil + `LocationPicker` (Fase 5) | 1 | M |

---

## EPIC-02 — Donaciones (Sprint 1)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-02.1 Publicar donación (RF-005) | Como donante, quiero publicar un objeto con título, descripción, categoría y estado. | • CRUD `donaciones` (Prisma + endpoints) • Wizard de publicación (5 pasos, Fase 5) • CRUD `categorias` (admin) | 1.5 | M |
| FEAT-02.2 Carga de fotografías (RF-006) | Como donante, quiero subir fotos de mi donación. | • Endpoint de firma Cloudinary (ADR-009) • `ImagenRepository` • Componente `ImageUploader` | 1 | M |
| FEAT-02.3 Ubicación de retiro (RF-007) | Como donante, quiero que se me pida ubicación solo si elijo retiro en domicilio. | • Validación condicional (Zod + `CHECK` de BD ya existe) • Paso 4 del wizard | 0.5 | M |

---

## EPIC-03 — Solicitudes (Sprint 2)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-03.1 Crear solicitud (RF-008) | Como beneficiario, quiero crear una solicitud con urgencia y evidencia opcional. | • CRUD `solicitudes` • Wizard de solicitud (Fase 5) | 1 | M |
| FEAT-03.2 Aceptar solicitud / Ofertas (RF-009) | Como donante, quiero aceptar una solicitud ofreciendo una donación mía. | • Endpoint `POST /solicitudes/:id/ofertas` + índice único parcial (ADR-011) • `EntregaCoordinacionService` • UI de "ofrecer" en detalle de solicitud | 1.5 | M |
| FEAT-03.3 Estados de solicitud (RF-010) | Como beneficiario, quiero ver el estado de mi solicitud avanzar. | • Máquina de estados en `SolicitudRepository` • `StatusBadge` con mapeo de color (Fase 5) | 0.5 | M |

---

## EPIC-04 — Trueques (Sprint 3)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-04.1 Publicar trueque (RF-011) | Como usuario, quiero publicar un objeto para trueque. | • CRUD `trueques` • Wizard de trueque (Fase 5, paso "qué buscas a cambio") | 1 | M |
| FEAT-04.2 Proponer trueque (RF-012) | Como usuario, quiero proponer un intercambio. | • Endpoint `POST /trueques/:id/propuestas` + validación dueño (Fase 4) | 1 | M |
| FEAT-04.3 Aceptación bilateral (RF-013) | Como usuario, quiero que ambas partes deban aceptar antes de coordinar. | • Índice único parcial (ADR-011) • `EntregaCoordinacionService` reutilizado • UI de aceptar/rechazar propuesta | 1 | M |

---

## EPIC-05 — Entregas y Coordinación (Sprint 2-3, transversal a Donaciones/Trueques)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-05.1 Coordinar entrega (CU-010) | Como usuario, quiero coordinar el retiro/entrega tras aceptar una oferta o propuesta. | • CRUD `entregas` (`GET`/`PATCH`) • Referencia polimórfica validada en servicio (ADR-015) • Pantalla de coordinación (Fase 5) | 1 | M |

---

## EPIC-06 — Inteligencia Artificial (Sprint 4)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-06.1 Chatbot (RF-014) | Como usuario, quiero conversar con un chatbot de orientación. | • `IAProviderAdapter.chat` (Claude Sonnet 5, Fase 7) • System prompt cacheado • `ChatWidget` (Fase 5) • Persistencia en `chatbot_conversaciones` | 1.5 | M |
| FEAT-06.2 Clasificación IA (RF-015) | Como usuario, quiero una sugerencia editable al publicar. | • `ClasificacionService` con salida estructurada (Haiku 4.5, ADR-025) • `IASuggestionBox` (Fase 5) • Log en `analisis_ia` | 1 | M |
| FEAT-06.3 Matching (RF-016) | Como usuario, quiero ver coincidencias recomendadas. | • Filtro determinista Postgres + `MatchingService` (scoring IA) • Endpoint `GET /ia/matching` • Sección de recomendaciones en detalle | 1.5 | S |
| FEAT-06.4 Moderación asistida (nueva, ADR-027) | Como administrador, quiero ver publicaciones marcadas por riesgo. | • Listener de eventos → IA de moderación • Badge de riesgo en panel admin | 1 | S |

---

## EPIC-07 — Administración y Moderación (Sprint 4)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-07.1 Panel administrativo (RF-018) | Como administrador, quiero aprobar, bloquear o eliminar usuarios y publicaciones. | • `ModeracionService` + endpoints `/admin/*` • Panel `/admin` (Fase 5) con tablas de usuarios/publicaciones/reportes | 1.5 | M |

---

## EPIC-08 — Mensajería (Sprint 5)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-08.1 Mensajería interna (RF-017) | Como usuario, quiero enviar mensajes para coordinar entrega/retiro. | • `ConversacionRepository` (Mongo) • Endpoints `/conversaciones/*` • `ConversationThread` (Fase 5) | 1 | S |

## EPIC-09 — Notificaciones (Sprint 5)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-09.1 Notificaciones in-app (RF-020) | Como usuario, quiero ver notificaciones de eventos relevantes. | • `NotificacionDispatchService` (listener, ya diseñado Fase 6) • Endpoints `/notificaciones` • Feed en navbar | 1 | S |
| FEAT-09.2 Correo vía n8n (Fase 8) | Como usuario, quiero recibir correo en eventos de alto valor. | • `N8nWebhookAdapter` • Workflow n8n (Switch + Send Email, Fase 8) • Configurar SMTP de prueba en n8n | 1 | S |

## EPIC-10 — Dashboard de Impacto (Sprint 5)

| Feature | Historia de usuario | Tareas / Subtareas | Días | Prioridad |
|---|---|---|---|---|
| FEAT-10.1 Dashboard (RF-019) | Como usuario, quiero ver indicadores de impacto social. | • `DashboardQueryService` (agregaciones Postgres + `eventos_sistema`) • `DashboardStatTile` en Inicio (Fase 5) | 1 | S |

---

## Resumen por sprint (referencia cruzada con Fase 11)

| Sprint | Épicas | Días estimados (referencial) |
|---|---|---|
| 0 | EPIC-11, EPIC-01 | ~6.5 |
| 1 | EPIC-02 | ~3 |
| 2 | EPIC-03, EPIC-05 (parcial) | ~4 |
| 3 | EPIC-04, EPIC-05 (parcial) | ~3 |
| 4 | EPIC-06, EPIC-07 | ~6.5 |
| 5 | EPIC-08, EPIC-09, EPIC-10 + QA/pulido (Fase 11) | ~4 + buffer |

Los totales no calzan exactamente a 5 días/sprint por diseño — hay margen implícito para imprevistos (coherente con los riesgos de Fase 11), y el Sprint 5 absorbe cualquier arrastre priorizando recortar "Should" antes que "Must".

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada. **El Plan Maestro completo (Fase -1 a Fase 12) queda cerrado.** El proyecto está listo para iniciar desarrollo, pendiente de autorización explícita del usuario para comenzar a generar código.
