# Plan de Ejecución — Backend DonaConnect Ecuador

**Tipo de documento:** distinto de `docs/fases/*` (diseño, ya aprobado y congelado). Este es un **tracker vivo de implementación** — se van marcando checkboxes a medida que se construye. No requiere aprobación del usuario por entrada (a diferencia de `docs/fases/`), pero cualquier desviación real del diseño aprobado se sigue registrando en el historial de la fase de diseño correspondiente (mismo patrón que Sprint 0/1).

**Fuente:** `docs/fases/fase-02` a `fase-11` (diseño ya cerrado) + lo aprendido construyendo Sprint 0-1 (código real).

**Cómo usar esto:** antes de empezar un sprint, revisar su checklist completo. Cada sprint sigue la misma secuencia de 7 pasos (ver abajo) — saltarse un paso es la forma más común de dejar el módulo a medio hacer.

---

## Secuencia fija por módulo (repetir en cada sprint)

1. **Prisma** — extender `schema.prisma`, generar migración, agregar a mano los `CHECK`/índices únicos parciales que Prisma no genera.
2. **`domain/<módulo>`** — entities (con invariantes), value-objects, ports (interfaces).
3. **`application/<módulo>`** — un caso de uso por operación/endpoint, orquesta vía puertos.
4. **`adapters/<módulo>`** — repositorios Prisma, controllers, schemas Zod, `external/` si integra un servicio externo.
5. **`main`** — rutas, wiring en `di-container.ts`, mapeo de errores nuevos en `error-handler.middleware.ts`.
6. **Verificar** — `npm run typecheck && npm run lint && npm run build` (los tres, no solo uno).
7. **Probar end-to-end** contra Postgres real (no confiar solo en el build) + actualizar historial de `fase-06-backend.md` con lo implementado y cualquier decisión no explícita en el diseño original.

⚠️ **Nota del Sprint 1:** el bug real que apareció (`ubicacionRetiroId` no persistido) vino de usar el DTO de respuesta pública (`toJSON()`) para construir el payload de Prisma en vez de getters dedicados de la entidad. Regla a mantener: **el DTO de API y los datos de persistencia son cosas distintas**, aunque a veces coincidan.

---

## Estado

| Sprint | Módulo | Estado |
|---|---|---|
| 0 | Identidad (auth, roles) | ✅ Hecho |
| 1 | Donaciones + Categorías | ✅ Hecho (bug de persistencia corregido, ver nota arriba) |
| 2 | Solicitudes + Ofertas | ✅ Hecho |
| 3 | Trueques + Propuestas | ✅ Hecho |
| 4 | Inteligencia Artificial + Administración | ✅ Código cerrado (2026-07-08) — ⚠️ ver nota de credencial IA abajo |
| 5 | Should-haves + QA final | ✅ Hecho (2026-07-08) — roadmap de 5 sprints cerrado |

---

## Deuda técnica detectada (retrofit, antes de cerrar Sprint 2)

**✅ Cerrado (2026-07-08).** Al revisar Fase 9 sección 3 contra el código de Sprint 0/1, **la auditoría (RNF-006) no estaba implementada**, aunque la tabla `auditoria` ya existía en el schema desde Fase 3 y el DoD transversal de Fase 11 la exige. Se cerró antes de empezar Sprint 2:

- [x] `domain/auditoria/ports/IAuditoriaRepository.ts` — sin entidad de dominio propia (log de solo-append sin invariantes, deviación deliberada del checklist original que proponía una entity — ver nota abajo)
- [x] `adapters/auditoria/repositories/PrismaAuditoriaRepository.ts`
- [x] `main/middlewares/audit.middleware.ts` — post-hoc genérico (envuelve `res.json`, registra en `res.on('finish')` solo si 2xx), reutilizable con `idDesdeRespuesta`/`idDesdeParametro`
- [x] Aplicado a rutas ya existentes: `POST /auth/registro` (`CREAR` Usuario), `POST /donaciones` (`CREAR` Donación, no estaba en el checklist original — se agregó al notar que Fase 9 sección 3 sí la lista), `DELETE /donaciones/:id` (`CANCELAR` Donación)
- [x] `LOGIN_FALLIDO` — no encaja en el middleware genérico (audita sobre fallo, no sobre éxito); se audita dentro de `IniciarSesionUseCase`, y **solo si el usuario existe** (correo inexistente no tiene `id_entidad` válido — caso ambiguo del diseño original, resuelto y documentado en `fase-09-seguridad.md`)
- [x] Verificado con consulta directa a Postgres: las 4 acciones generan su fila; un login exitoso no genera ninguna
- [ ] A partir de aquí, todo nuevo endpoint sensible (crear/aprobar/cancelar/bloquear/eliminar) se audita en el mismo sprint en que se construye — no se pospone

---

## Sprint 2 — Solicitudes y Ofertas (Semana 3) ✅ Cerrado (2026-07-08)

**DoD (Fase 11):** beneficiario crea solicitud → donante la acepta → estado `ACEPTADA_POR_DONANTE` → se crea automáticamente un registro en `entregas`. **Cumplido y verificado end-to-end contra Postgres real**, incluyendo una prueba de concurrencia real con dos peticiones en paralelo.

**Prisma:**
- [x] `solicitudes`, `ofertas_solicitud`, `entregas` (`id_referencia` sin FK — polimórfico, ADR-015)
- [x] Índice único parcial a mano: `uq_oferta_activa_por_solicitud` (ADR-011)
- [x] `prisma generate` dentro del contenedor además del host (mismo paso manual de Sprint 1, todavía no automatizado — ver nota de Sprint 5 sobre `docker compose up` limpio)

**Domain:**
- [x] `domain/solicitudes/entities/Solicitud.ts` — Aggregate Root con `Oferta` como entidad hija
- [x] `Urgencia`, `EstadoSolicitud`, `EstadoOferta` (value-objects)
- [x] Invariante de auto-rechazo de `PENDIENTE` implementada de forma defensiva (en la práctica, con el flujo de un solo paso de Fase 4, nunca hay una `PENDIENTE` que rechazar — el gating de `puedeRecibirOferta()` lo impide antes)
- [x] `ISolicitudRepository` (incluye ofertas) + método nuevo `buscarPorOfertaDonacionAceptada` (para resolver partes de una Entrega)
- [x] `domain/entregas/entities/Entrega.ts`, value-objects, `IEntregaRepository`, `EntregaCoordinacionService` (Domain Service)

**Application:**
- [x] `CrearSolicitudUseCase`, `ListarSolicitudesUseCase`, `ObtenerSolicitudUseCase`, `ActualizarSolicitudUseCase`
- [x] `CrearOfertaUseCase` — un solo paso, crea la oferta `ACEPTADA` e invoca `EntregaCoordinacionService` síncronamente; valida además que el donante sea dueño de la donación ofrecida (no explícito en el diseño original, agregado por sentido de negocio) y que no oferte sobre su propia solicitud
- [x] `ActualizarOfertaUseCase` — RF-010, rechaza incluso una oferta ya `ACEPTADA` (interpretación del diseño, ver historial de Fase 6) y revierte `estadoSolicitud` a `ABIERTA`
- [x] `ObtenerEntregaUseCase`, `ActualizarEntregaUseCase` + `EntregaAutorizacionService` (resuelve "partes involucradas" cruzando Donaciones + Solicitudes)

**Adapters:**
- [x] `PrismaSolicitudRepository` (ofertas anidadas vía `$transaction` + `upsert`), `PrismaUbicacionSolicitudRepository` (tipo `ESTABLECIDA`), `PrismaEntregaRepository`
- [x] `SolicitudesController`, `EntregasController` + schemas Zod

**Main:**
- [x] `solicitudes.routes.ts`, `entregas.routes.ts` con el RBAC de Fase 4
- [x] Errores nuevos en `error-handler.middleware.ts` (11 clases) — `OfertaYaActivaError` bespoke **no fue necesaria**: el catch-all genérico de `P2002` (ya existente desde Sprint 0) cubre la colisión del índice único parcial sin duplicar código
- [x] `crearAuditMiddleware` extendido con un predicado condicional (`debeAuditar?`) — `PATCH /solicitudes/:id` sirve tanto para editar como cancelar, solo audita la segunda

**Transversal:**
- [x] Auditado: `CREAR` (Solicitud), `APROBAR` (Oferta — id de la oferta, no de la solicitud; se agregó `idDeOfertaAceptada` en `audit.middleware.ts`), `CANCELAR` (Solicitud, condicional)
- [x] Concurrencia real probada: dos `curl` en paralelo contra la misma solicitud `ABIERTA` — uno ganó (201), el otro recibió `422 UNPROCESSABLE` (bloqueado por el gating de aplicación antes de llegar a la BD); no se observó corrupción de estado. El 409 de BD (P2002) es el respaldo para una carrera aún más ajustada que el gating no alcance a atrapar.

---

## Sprint 3 — Trueques y Propuestas (Semana 4) ✅ Cerrado (2026-07-08)

**DoD (Fase 11):** dos usuarios completan un trueque de extremo a extremo: publicar → proponer → aceptar → coordinar entrega → estado `INTERCAMBIADO`. **Cumplido hasta `EN_COORDINACION` + Entrega creada y confirmable** — el último salto a `INTERCAMBIADO` no es alcanzable por ningún flujo implementado todavía (gap real, ver nota abajo, no exclusivo de Trueques).

**Riesgo:** confirmado bajo — estructuralmente análogo a Sprint 2. La diferencia clave (**aceptación bilateral explícita**, RF-013, en dos pasos genuinamente distintos en vez de uno) se implementó y probó correctamente.

**Prisma:**
- [x] `trueques`, `propuestas_trueque` + `CHECK (id_trueque_origen <> id_trueque_ofrecido)` a mano
- [x] Índice único parcial a mano: `uq_propuesta_activa_por_trueque`
- [x] `IImagenRepository` propio de `trueques` (no se importó el de `donaciones`, mismo criterio)

**Domain:**
- [x] `domain/trueques/entities/Trueque.ts` — `PropuestaTrueque` vive dentro del aggregate del trueque **origen** (el que la recibe)
- [x] `EstadoTrueque`, `EstadoPropuesta`, `EstadoObjeto` (value-objects)
- [x] La invariante de auto-rechazo de `PENDIENTE` **sí es alcanzable aquí** (a diferencia de Sprint 2): múltiples propuestas de distintos proponentes coexisten como `PENDIENTE` hasta que el dueño del origen acepta una
- [x] `ITruequeRepository`

**Application:**
- [x] `PublicarTruequeUseCase`, `ListarTruequesUseCase`, `ObtenerTruequeUseCase`, `ActualizarTruequeUseCase`
- [x] `ProponerTruequeUseCase` — crea `PENDIENTE`, confirmado que **NO auto-acepta**; valida dueño del ofrecido, `origen ≠ ofrecido`, y que el proponente no sea dueño del propio origen (interpretación de "auto-transacción inválida", Fase 4 sección 5, extendida a trueques)
- [x] `ResponderPropuestaUseCase` — el dueño del origen acepta/rechaza; al aceptar, **ambos trueques pasan a `EN_COORDINACION` directamente** (no `ACEPTADO` como intermedio — ver decisión en historial de Fase 6) vía dos escrituras de repositorio separadas (dos aggregates); rechazar una ya `ACEPTADA` revierte ambos lados
- [x] `FirmarSubidaImagenUseCase`/`RegistrarImagenUseCase` propios (reutilizan `ICloudStorage` de donaciones directamente, sin duplicarlo)

**Adapters:**
- [x] `PrismaTruequeRepository` (propuestas anidadas vía `$transaction` + `upsert`, mismo patrón que Sprint 2), `TruequesController` + schemas
- [x] `EntregaCoordinacionService` reutilizado tal cual de Sprint 2 (sin cambios) — `EntregaAutorizacionService` sí se extendió (ver Main)

**Main:**
- [x] `trueques.routes.ts` con el RBAC de Fase 4
- [x] `EntregaAutorizacionService` completado: el placeholder de Sprint 2 para `tipoOperacion=TRUEQUE` ahora resuelve ambas partes vía `ITruequeRepository`; se refactorizó su tipo de retorno a un array genérico de ids (ya no `{donanteId, beneficiarioId}`, que no aplica a trueques)
- [x] Errores nuevos en `error-handler.middleware.ts` (13 clases)

**Transversal:**
- [x] Auditado: `CREAR` (Trueque), `APROBAR` (PropuestaTrueque — id de la propuesta, directo desde `req.params`, más simple que el caso de Sprint 2 porque ya viene en la URL), `CANCELAR` (Trueque, condicional)
- [x] Flujo bilateral completo probado end-to-end, confirmando explícitamente que `POST .../propuestas` deja la propuesta `PENDIENTE` (no auto-acepta)
- [x] Concurrencia real probada: **dos propuestas distintas y ya existentes** compitiendo por ser aceptadas sobre el mismo trueque origen (a diferencia de Sprint 2, donde la carrera era "crear+aceptar" en un solo paso) — una ganó, la otra recibió `422` (ya había sido auto-rechazada por la primera), sin corrupción de estado

**⚠️ Gap detectado (no exclusivo de Trueques, candidato a Sprint 5):** ni Donación→`ENTREGADA`, ni Solicitud→`ATENDIDA`, ni Trueque→`INTERCAMBIADO` son alcanzables hoy — confirmar una `Entrega` (`PATCH /entregas/:id`) no repercute en el aggregate de origen que la generó. Los tres flujos llegan hasta el estado de coordinación/aceptación y se detienen ahí. Ver ítem agregado en Sprint 5.

---

## Sprint 4 — Inteligencia Artificial y Administración (Semana 5) ✅ Cerrado (2026-07-08, verificado con Gemini)

**DoD (Fase 11):** chatbot responde en <10s (RNF-002); sugerencia de IA aparece al publicar y es editable; admin aprueba/bloquea publicaciones desde el panel. **Cumplido.**

**⚠️ Mayor riesgo del roadmap, materializado y resuelto con cambio de proveedor (Sprint 5):** la `IA_API_KEY` provista por el usuario en `.env` fue **rechazada por la API de Anthropic** (`401 invalid x-api-key`), y Anthropic no ofrece un tier gratuito permanente. A pedido explícito del usuario, el proveedor cableado en producción cambió de Claude a **Gemini** (Google AI Studio ofrece keys gratuitas) — ver `docs/fases/fase-07-inteligencia-artificial.md` historial para la decisión completa (desvía ADR-024). `adapters/ia/external/GeminiAdapter.ts` implementa el mismo puerto `IIAProvider`; `ClaudeAdapter` se conserva sin eliminar como alternativa. **Verificado end-to-end (2026-07-08) contra la API real de Gemini:** chatbot (~5s, respuesta coherente), clasificar (categoría/título/descripción sugeridos), matching (score + razón), moderación IA automática al publicar (`riesgoDetectado`/`confianza` correctos en `analisis_ia`). Sin acciones pendientes.

**Retrofit necesario antes de lo nuevo:**
- [x] `main/event-bus.ts` — `EventEmitter` in-process (ADR-023)
- [x] `eventBus.emit(...)` agregado a `PublicarDonacionUseCase`, `CrearSolicitudUseCase`, `PublicarTruequeUseCase` (los tres necesarios para probar el listener nuevo; los de aceptación quedan para cuando tengan un listener real, Sprint 5)

**Domain/Application (IA):**
- [x] `domain/ia/ports/IIAProvider.ts` (`chat`, `clasificar`, `matchScore`, `evaluarRiesgo`) — Open Host Service, Fase 2 sección 2
- [x] `adapters/ia/external/ClaudeAdapter.ts` — Sonnet 5 (chat) / Haiku 4.5 (clasificar, matchScore, evaluarRiesgo), salida estructurada + prompt caching, `IAProviderNoConfiguradoError` (RNF-002)
- [x] `main/mongoose-connection.ts` + `domain/ia/ports/{IConversacionChatbotRepository,IAnalisisIARepository}.ts` + adapters Mongoose — **primer módulo que toca MongoDB**
- [x] `ChatbotOrquestacionService` — un documento Mongo por usuario (no por sesión), historial acotado a 15 mensajes; decisión documentada en `fase-06-backend.md` historial
- [x] `ClasificacionService` — endpoint síncrono `POST /ia/clasificar` (sigue Fase 7 sección 3, no Fase 6 sección 5); **no persiste en `analisis_ia`** (no hay `entidadId` real antes de publicar — decisión documentada)
- [x] `MatchingService` — filtro determinista (categoría + estado, sin `MapsAdapter`/radio geográfico — no implementado en ningún flujo del proyecto) + scoring IA sobre candidatos preseleccionados; prioriza `urgencia:ALTA`
- [x] `ModeracionIAService` — **primer listener real** de `DonacionPublicada`/`SolicitudCreada`/`TruequePublicado`, persiste en `analisis_ia` (extendido con campos de riesgo), emite `RiesgoDetectado`, nunca bloquea

**Domain/Application (Administración):**
- [x] `domain/administracion/services/ModeracionService.ts` — opera directamente sobre `IUsuarioRepository`/`IDonacionRepository`/`ISolicitudRepository`/`ITruequeRepository` (excepción "Anti-corrupción/operación directa autorizada", Fase 2)
- [x] `Usuario.activar()/suspender()/eliminar()` + `IUsuarioRepository.actualizar()` (no existía)
- [x] `BLOQUEAR`/`ELIMINAR` sobre publicaciones reutilizan el estado terminal `CANCELADA`/`CANCELADO` ya existente (no hay `BLOQUEADA` en el modelo físico de Fase 3) — decisión documentada
- [x] Endpoints: `PATCH /admin/{donaciones|solicitudes|trueques|usuarios}/:id/moderar`, `GET /admin/reportes` — todos `ADMINISTRADOR`

**Transversal:**
- [x] Auditado: `APROBAR`/`BLOQUEAR`/`ELIMINAR` vía `crearAuditMiddlewaresModeracion()` (nuevo helper, 3 middlewares condicionales por ruta `.../moderar`) — verificado por consulta directa a Postgres (`CREAR`→`APROBAR`→`BLOQUEAR`)
- [x] RNF-002 verificado (de forma no planeada pero concluyente, gracias al 401 de la key inválida): `POST /donaciones` respondió `201` en <600ms mientras `ModeracionIAService` fallaba de forma completamente asíncrona en segundo plano, error atrapado por `NodeEventBus.on()` sin propagarse
- [x] `npm run typecheck && npm run lint && npm run build` — limpios
- [x] Probado end-to-end contra Docker real (Postgres + MongoDB + Claude API): registro/login, chatbot (conversación Mongo, dueño-check 403), clasificar, matching (candidatos reales encontrados), moderación IA automática al publicar, reportes, moderar donación/usuario, RBAC, auditoría — todos los flujos llegan correctamente hasta la llamada a Claude, que falla por credencial inválida (no por el código)

---

## Sprint 5 — Should-haves, integración final y QA (Semana 6) ✅ Cerrado (2026-07-08)

**DoD (Fase 11):** `docker compose up` sin intervención manual; pruebas de integración de los 3 flujos core pasando en CI; dashboard con KPIs reales; los 16 RF "Must have" verificables end-to-end. **Cumplido.**

**Domain/Application (Mensajería):**
- [x] `domain/mensajeria/entities/Conversacion.ts` — Aggregate Root real (invariante `esParticipante`), MongoDB colección `mensajes` (ADR-012)
- [x] `EnviarMensajeUseCase`, `ListarConversacionesUseCase`, `ListarMensajesUseCase` — `GET/POST /conversaciones...` (Fase 4). Decisión documentada: no existe `POST /conversaciones` en Fase 4, así que `:id` en las rutas de mensajes es el **otro participante**, no un id de conversación — se crea implícitamente al primer mensaje

**Domain/Application (Notificaciones):**
- [x] `NotificacionDispatchService` — **segundo listener real** del Event Bus, se suscribe a los 12 eventos de dominio + `RiesgoDetectado` y escribe en Mongo `notificaciones`
- [x] `GET /notificaciones`, `PATCH /notificaciones/:id/leido`

**n8n (Fase 8):**
- [x] `adapters/notificaciones/external/N8nWebhookAdapter.ts` — implementa `IWebhookNotifier`, POST con el contrato exacto de Fase 8 sección 2, verificado contra el contenedor `n8n` real
- [x] Solo los 7 eventos de "alto valor" disparan correo (dentro de `NotificacionDispatchService`, vía `notificarConCorreo`, en vez de una suscripción separada — mismo servicio, dos canales)
- [x] Resultado registrado en `logs_n8n` (Mongo) — fallo no bloqueante confirmado (`HTTP 404` porque el workflow de n8n no está configurado en su UI, correctamente registrado como `FALLIDO` sin afectar el evento de dominio)
- [ ] Configurar el workflow real en la UI de n8n (Webhook Trigger → Switch → Set → Send Email) — fuera de alcance de este documento (config. externa a n8n, no código de backend)
- [ ] Credenciales SMTP dentro de n8n — mismo motivo, no aplica a este documento

**Dashboard:**
- [x] `DashboardQueryService` — conteos de Postgres (`estado_*`) + `$group` sobre `eventos_sistema` (Mongo), `GET /dashboard/impacto`
- [x] `eventos_sistema` — no lo poblaba nada; se agregó como parte de `NotificacionDispatchService` (no un listener separado), solo para los 3 eventos "de cierre positivo" marcados KPI en Fase 6 sección 5 (`SolicitudAtendida`/`TruequeIntercambiado`/`EntregaConfirmada`)

**QA / Cierre:**
- [x] **Gap heredado de Sprints 2-3, cerrado:** confirmar una `Entrega` ahora transiciona el aggregate de origen — Donación→`ENTREGADA` (+ Solicitud asociada→`ATENDIDA`), Trueque→`INTERCAMBIADO` en ambos lados. Resuelto con **cascada síncrona directa** (`EntregaCierreOrigenService`), no vía Event Bus. Verificado end-to-end contra Postgres real para los 3 flujos.
- [x] Pruebas de integración (Vitest + Supertest, `backend/tests/`) para los 3 flujos core — 6 tests, todos verdes contra Postgres/MongoDB reales (incluida una corrida contra base de datos completamente limpia)
- [x] CI (`.github/workflows/ci.yml`, ya existía con lint/typecheck/build): se agrega el job `backend-test` con servicios Postgres 18.3/MongoDB 8.3.4 reales
- [x] `npm audit` revisado: 8 vulnerabilidades, ambas cadenas son dev-time/install-time (`esbuild` vía `vitest`; `tar` vía `bcrypt`'s `@mapbox/node-pre-gyp`), ninguna alcanzable desde la superficie HTTP de la API en ejecución — riesgo aceptado y documentado, no se fuerzan upgrades breaking sin poder re-verificar
- [x] **Bug real corregido:** Mongoose pluraliza nombres de modelo sin colección explícita — `analisis_ia`/`eventos_sistema`/`logs_n8n` se guardaban como `analisis_ias`/`eventos_sistemas`/`logs_n8ns`. Corregido en los 3 repositorios Mongoose con nombre de colección explícito
- [x] `docker compose up` limpio desde cero confirmado (`docker compose down -v && docker compose up --build`, seguido de los 6 tests de integración, sin ningún paso manual): el `Dockerfile` sí tenía el gap señalado — su `CMD` ahora corre `prisma generate && prisma migrate deploy` en cada arranque, no solo en build
- [ ] Ajustes de responsive final (Fase 5) — **fuera de alcance**, es trabajo de frontend; este documento y esta sesión de implementación son solo backend (ver nota al pie)

---

## Fuera del alcance de este documento

- **Frontend:** el wizard de publicación (Fase 5, 5 pasos), pantallas de admin, chatbot UI, etc. no están cubiertos aquí — este plan es solo backend, siguiendo el mismo alcance que tuvieron Sprint 0 y 1.
- **Este documento no reemplaza `docs/fases/fase-11-roadmap.md`** (que define objetivo/historias/riesgos/DoD por sprint, ya aprobado) — lo complementa con el desglose técnico capa por capa para ejecutar sin saltarse pasos.
