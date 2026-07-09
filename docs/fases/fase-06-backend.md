# Fase 6 — Backend

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-09 (extensión post-cierre, Sprint F4 frontend)
**Fuente:** Fases 0-5 + `docs/DECISIONES.md`

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Estructura de módulos, orquestación de los 16 casos de uso, servicios de dominio/aplicación/infraestructura, repositorios, mecanismo de eventos e integraciones. Se fija TypeScript, Zod y Event Bus in-process. Aún sin código — solo diseño de implementación. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 7. |
| 2026-07-07 | Corrección de arquitectura a pedido del usuario: la estructura de módulos (sección 1) pasa de capas técnicas (`routes/controllers/services/repositories`) a **arquitectura hexagonal** (`domain/application/infrastructure`) por Bounded Context, aplicando la decisión fijada en Fase 1 (ADR-042). Servicios, repositorios e integraciones (secciones 3-6) no cambian de responsabilidad, solo se reencuadran como puertos/adaptadores. |
| 2026-07-07 | Refinamiento a pedido del usuario ("Arquitectura Hexagonal + DDD + Clean Architecture PARA EL API"): sección 1 pasa a las **4 capas explícitas de Clean Architecture** (`domain/application/adapters` por módulo + `main/` como composition root único), alineada con Fase 1 sección 10 (ADR-044). Secciones 3, 4 y 6 actualizan sus referencias de carpeta (`infrastructure/` → `adapters/`). |
| 2026-07-08 | Corrección a pedido del usuario tras ver el código de Sprint 0: sección 1 pasa a **estructura layer-first** — capas al tope de `backend/`, Bounded Context como subcarpeta dentro de cada capa. Se documenta la resolución de imports entre capas vía path aliases + `tsc-alias` (ADR-046, refina ADR-042/044). Aplicado y verificado en el código real. |
| 2026-07-08 | Auditoría de cumplimiento de la regla de dependencia sobre el código de Sprint 0: se corrige la única violación encontrada — `UsuariosController` inyectaba `IUsuarioRepository` directamente, saltándose la capa `application`. Se crea `ObtenerPerfilUseCase` (GET /usuarios/me) y el controller ahora solo invoca casos de uso, como exige la sección 1. |
| 2026-07-08 | Sprint 1 implementado (Donaciones y Categorías, Fase 11): módulos `domain/categorias`, `application/categorias`, `adapters/categorias` y `domain/donaciones`, `application/donaciones`, `adapters/donaciones` agregados sobre la misma estructura layer-first. Se agregan dos decisiones de implementación no explícitas en el diseño original, documentadas aquí por trazabilidad: (1) la ubicación de retiro (VO reutilizado, Fase 2 sección 3) se persiste vía un puerto propio de `donaciones` (`IUbicacionRetiroRepository`) en vez de pasar por un caso de uso de `identidad`, tratándola como VO verdaderamente compartido y no como dato exclusivo del aggregate Usuario; (2) la verificación de "dueño del recurso" (ownershipMiddleware, sección 7) se resuelve dentro del propio caso de uso en vez de como middleware HTTP separado, porque el caso de uso ya necesita cargar el aggregate para mutarlo — evita una segunda consulta redundante sin perder la garantía de que ningún cambio de estado ocurre antes de validar la propiedad. Probado end-to-end contra Postgres real (crear/listar/detalle/editar/cancelar categoría y donación, regla de ubicación de retiro condicionada — regla de negocio #5 —, ADR-019 de visibilidad de ubicación exacta, y el flujo de imágenes firma+registro). |
| 2026-07-08 | Retrofit de auditoría (RNF-006, Fase 9 sección 3), pendiente desde Sprint 0. Se agrega `domain/auditoria` (solo el puerto `IAuditoriaRepository` — sin entidad de dominio propia, es un log de solo-append sin invariantes que proteger, no un aggregate) y `adapters/auditoria/repositories/PrismaAuditoriaRepository`. Se implementa `auditMiddleware` (`main/middlewares/audit.middleware.ts`) como middleware **post-hoc genérico**: envuelve `res.json` para capturar el cuerpo de la respuesta y registra en `res.on('finish')` solo si la respuesta fue 2xx, sin bloquear al cliente si falla el registro. Aplicado a `POST /auth/registro` (`CREAR` Usuario), `POST /donaciones` (`CREAR` Donación) y `DELETE /donaciones/:id` (`CANCELAR` Donación). **Excepción documentada:** `LOGIN_FALLIDO` no encaja en el patrón "post-hoc sobre éxito" (se audita justo lo contrario, un fallo) y se audita directamente dentro de `IniciarSesionUseCase` en vez del middleware genérico — pero **solo cuando el usuario existe y la contraseña es incorrecta**; si el correo no existe no hay `id_entidad` válido que referenciar (la tabla `auditoria` exige `id_entidad NOT NULL`, Fase 3, y Fase 9 sección 3 no resuelve este caso explícitamente). Verificado con consulta directa a Postgres: las 4 acciones generan su fila correctamente y un login exitoso no genera ninguna. |
| 2026-07-08 | Sprint 2 implementado (Solicitudes, Ofertas y Entregas, Fase 11): módulos `domain/solicitudes`, `application/solicitudes`, `adapters/solicitudes` y `domain/entregas`, `application/entregas`, `adapters/entregas`. Decisiones no explícitas en el diseño original, documentadas por trazabilidad: (1) `Oferta` vive como entidad hija dentro del aggregate `Solicitud` (Fase 2), incluyendo la invariante de auto-rechazo de pendientes (defensiva — con el flujo de un solo paso de Fase 4 no debería haber ninguna PENDIENTE que rechazar en la práctica, pero se deja explícita por si el flujo se extiende); (2) RF-010 ("rechazar manualmente") se interpretó como aplicable también a una oferta ya `ACEPTADA` (no solo `PENDIENTE`, que en este diseño nunca se alcanza) — al rechazarla, `estadoSolicitud` vuelve a `ABIERTA` para admitir nuevas ofertas; (3) `EntregaCoordinacionService` se modela como Domain Service (`domain/entregas/services/`) invocado síncronamente dentro de `CrearOfertaUseCase` — sin Event Bus, consistente con Fase 6 sección 5; (4) como `Entrega` solo guarda una referencia polimórfica (ADR-015), resolver "partes involucradas" para la autorización de `/entregas/:id` exige una consulta cruzada (`IDonacionRepository` + `ISolicitudRepository.buscarPorOfertaDonacionAceptada`, nuevo método) — encapsulada en `EntregaAutorizacionService` (capa `application`); el caso `tipoOperacion=TRUEQUE` queda como placeholder hasta Sprint 3. Se extiende `auditMiddleware` con un predicado condicional opcional (`debeAuditar`) porque `PATCH /solicitudes/:id` sirve tanto para editar como para cancelar y solo la segunda se audita. Probado end-to-end contra Postgres real: creación de solicitud con ubicación obligatoria, ADR-019 aplicado también a la visibilidad de `ofertas` (solo dueño/admin/donante-autor), aceptación de oferta en un paso con creación automática de la Entrega, autorización de `/entregas/:id` para ambas partes vs. terceros, confirmación de entrega, rechazo manual de una oferta `ACEPTADA` revirtiendo el estado de la solicitud, y una prueba de concurrencia real (dos donantes ofertando en paralelo sobre la misma solicitud) que no corrompió el estado. |
| 2026-07-08 | Sprint 3 implementado (Trueques y Propuestas, Fase 11): módulos `domain/trueques`, `application/trueques`, `adapters/trueques`. A diferencia de Sprint 2 (un solo paso), RF-013 exige **aceptación bilateral explícita** en dos pasos genuinamente distintos: `ProponerTruequeUseCase` crea la propuesta `PENDIENTE` (múltiples propuestas de distintos proponentes SÍ pueden coexistir mientras ninguna esté aceptada — a diferencia de Sprint 2, aquí el escenario de "auto-rechazo de PENDIENTE" del ADR-011 sí es alcanzable en la práctica) y `ResponderPropuestaUseCase` (solo el dueño del trueque origen) acepta/rechaza. Al aceptar, **dos aggregates distintos** cambian de estado (`truequeOrigen.estadoTrueque` vía `aceptarPropuesta()` y `truequeOfrecido.estadoTrueque` vía el nuevo método `marcarEnCoordinacion()`, con dos escrituras de repositorio separadas — mismo criterio de "sin transacción cross-aggregate explícita" ya aceptado en Sprint 2) — ambos pasan a `EN_COORDINACION` (no `ACEPTADO`: se interpretó que, como la creación de la Entrega es inmediata y síncrona igual que en Sprint 2, no hay un estado intermedio real que persistir). Rechazar una propuesta ya `ACEPTADA` revierte ambos trueques (`revertirDeCoordinacion()` en el ofrecido). `EntregaAutorizacionService` (Sprint 2) se completa: el placeholder de `tipoOperacion=TRUEQUE` ahora resuelve ambas partes vía `ITruequeRepository` (dueño del origen + `usuarioProponenteId` de la propuesta `ACEPTADA`) — se refactorizó su tipo de retorno de `{donanteId, beneficiarioId}` a un array genérico de ids, ya que "las dos partes" ya no mapean a esos nombres para trueques. Se agregó el flujo de imágenes (`POST /trueques/:id/imagenes/firma` y `/imagenes`) por analogía con Donaciones — Fase 4 no lo lista explícitamente en el catálogo de endpoints de BC-Trueques, pero Fase 2 sección 3 sí declara CU-004 como transversal a los 3 módulos y Fase 3 ya modela `imagenes.tipo_entidad` incluyendo `TRUEQUE`; se reutiliza `ICloudStorage` de `donaciones` directamente (puerto sin estado propio de ningún módulo, criterio distinto al de los repositories) en vez de duplicarlo. **Gap detectado, no resuelto en este sprint:** ningún flujo (Donación→`ENTREGADA`, Solicitud→`ATENDIDA`, Trueque→`INTERCAMBIADO`) tiene hoy un mecanismo para alcanzar su estado terminal positivo — confirmar una `Entrega` (`PATCH /entregas/:id`) no repercute en el aggregate de origen. Documentado como pendiente consolidado, candidato a Sprint 5. Probado end-to-end contra Postgres real: propuesta que NO se auto-acepta, aceptación bilateral con ambos trueques pasando a `EN_COORDINACION`, Entrega creada automáticamente y autorizada para ambas partes, rechazo de una propuesta ya aceptada revirtiendo ambos lados, filtrado de visibilidad de `propuestasRecibidas` por proponente, y una prueba de concurrencia real con dos propuestas *distintas* compitiendo por ser aceptadas sobre el mismo trueque origen. |
| 2026-07-08 | Sprint 4 implementado (Inteligencia Artificial y Administración, Fase 11). **Retrofit previo:** `main/event-bus.ts` (`EventEmitter` in-process, ADR-023) + `eventBus.emit(...)` agregado a `PublicarDonacionUseCase`, `CrearSolicitudUseCase`, `PublicarTruequeUseCase` (los únicos tres necesarios para probar el primer listener real de este sprint). **BC-IA:** `domain/ia/ports/IIAProvider.ts` + `adapters/ia/external/ClaudeAdapter.ts` (Claude Sonnet 5 para chat, Haiku 4.5 para clasificar/matchScore/evaluarRiesgo, salida estructurada `output_config.format`, prompt caching — ADR-024/025/026); `IAProviderNoConfiguradoError` replica el patrón RNF-002 ya usado en `CloudinariaAdapter` (Sprint 1). Primer módulo que toca MongoDB: `main/mongoose-connection.ts` + dos puertos/adaptadores Mongoose (`IConversacionChatbotRepository`, `IAnalisisIARepository`). Decisiones no explícitas en el diseño original, documentadas por trazabilidad: (1) **`chatbot_conversaciones` es un documento por usuario, no por sesión** — `sesiones[]` registra cada `sesionId` distinto y `mensajes[]` es el historial combinado de todas sus sesiones; Fase 3 sección 7.1.2 no distingue explícitamente entre ambas lecturas posibles del sketch, se eligió la de "1 doc por usuario" porque encaja sin tabla de mapeo adicional con `GET /chatbot/conversaciones/:id — Dueño` (Fase 4); (2) `ClasificacionService` **no persiste en `analisis_ia`** pese a que Fase 7 sección 3 dice "se registra en analisis_ia": el disparo ocurre *antes* de publicar (Fase 7 sección 3, "al llegar al último paso del wizard"), por lo que no existe todavía un `entidadId` real al que asociar el registro sin introducir un id temporal fuera de alcance — se prioriza el flujo human-in-the-loop (ADR-010) sobre la trazabilidad histórica de sugerencias no usadas; (3) `analisis_ia` se extiende con `riesgoDetectado/categoriaRiesgo/confianza/explicacion` (moderación, Fase 7 sección 5) — campos no listados en el sketch original de Fase 3 pero coherentes con su propósito de "log de análisis IA" (MongoDB no fuerza schema); (4) `MatchingService` filtra determinísticamente por categoría + estado en Postgres (sin radio geográfico vía `MapsAdapter`, mencionado en Fase 7 sección 4 pero no implementado en ningún otro flujo del proyecto — los filtros de listados existentes de Sprints 1-3 tampoco lo tienen; agregarlo sería una funcionalidad nueva fuera de alcance), prioriza `urgencia:ALTA` en el orden final cuando el origen es una Donación (regla de negocio, no delegada a la IA), y excluye Trueques del propio dueño de sus propios candidatos de coincidencia (Trueque no tiene ubicación modelada, a diferencia de Donación/Solicitud). `ModeracionIAService` es el **primer listener real** del Event Bus: se suscribe a `DonacionPublicada`/`SolicitudCreada`/`TruequePublicado`, nunca bloquea ni decide (ADR-027) — el wrapper de `NodeEventBus.on()` ya atrapa cualquier error del listener sin afectar la respuesta HTTP de publicación. **BC-Administración:** `domain/administracion/services/ModeracionService.ts` — Domain Service con la excepción "Anti-corrupción/operación directa autorizada" de Fase 2 sección 2, toca `IUsuarioRepository`/`IDonacionRepository`/`ISolicitudRepository`/`ITruequeRepository` directamente. Decisión documentada: **`BLOQUEAR` y `ELIMINAR` sobre una publicación (Donación/Solicitud/Trueque) transicionan al mismo estado terminal `CANCELADA`/`CANCELADO` ya existente** (reutilizan `cancelar()`), distinguidos solo por el `accion` auditado — el modelo físico aprobado en Fase 3 no define un estado `BLOQUEADA` independiente para estas tablas (a diferencia de `usuarios`, que sí distingue `SUSPENDIDO`/`ELIMINADO` vía los nuevos métodos `Usuario.activar()/suspender()/eliminar()`); `APROBAR` sobre una publicación no cambia su estado, solo queda auditado como revisión humana. `Usuario` gana `actualizar()` en `IUsuarioRepository`/`PrismaUsuarioRepository` (no existía, solo se creaba/leía hasta ahora). `crearAuditMiddlewaresModeracion()` (nuevo helper en `audit.middleware.ts`) registra 3 middlewares condicionales por ruta `.../moderar` (uno por `accion` posible), mismo patrón que el `debeAuditar` de Sprint 2 aplicado 3 veces. **Probado end-to-end contra Postgres + MongoDB + Claude API reales:** registro/login de usuarios de prueba, chatbot (crea/reutiliza conversación en Mongo, dueño-check 403 confirmado), clasificar, matching (prefiltro determinista confirmado con candidatos reales de sprints anteriores), moderación IA disparada automáticamente al publicar una donación, `GET /admin/reportes`, `PATCH /admin/donaciones/:id/moderar` (`APROBAR` sin cambio de estado, `BLOQUEAR` → `CANCELADA`, reintento sobre publicación ya finalizada → `422` correctamente), `PATCH /admin/usuarios/:id/moderar` (`SUSPENDIDO`↔`ACTIVO`), RBAC `ADMINISTRADOR` confirmado con `403` para otros roles, y auditoría verificada por consulta directa a Postgres (`CREAR`→`APROBAR`→`BLOQUEAR`). **RNF-002 (integraciones no bloqueantes) verificado de forma no planeada pero concluyente:** la `IA_API_KEY` provista en `.env` es rechazada por la API de Anthropic (`401 invalid x-api-key` — el formato `AQ.Ab8RN6LY...` no corresponde al de una clave Anthropic estándar, `sk-ant-api03-...`); esto convirtió cada llamada real a Claude en una falla garantizada, y permitió confirmar empíricamente que `PublicarDonacionUseCase` sigue respondiendo `201` en <600ms mientras `ModeracionIAService` falla de forma completamente asíncrona en segundo plano (error atrapado y logueado por `NodeEventBus.on()`, nunca propagado). **⚠️ Pendiente de acción del usuario, no del código:** reemplazar `IA_API_KEY` en `.env` por una clave válida de Anthropic para verificar que el chatbot/clasificación/matching/moderación producen respuestas reales — toda la integración (SDK, prompts, salida estructurada, persistencia Mongo, Event Bus, endpoints, RBAC, auditoría) está construida y verificada hasta el límite de la llamada HTTP a Claude; solo la credencial está pendiente. |
| 2026-07-08 | Sprint 5, parte 1/2 — **cierre del gap heredado de Sprints 2-3** (ningún flujo alcanzaba su estado terminal positivo). Se agrega `domain/entregas/services/EntregaCierreOrigenService.ts` — Domain Service nuevo (no se reutilizó `EntregaCoordinacionService` porque este último se instancia temprano en `di-container.ts`, antes de que `solicitudRepository`/`truequeRepository` existan; el nuevo servicio se instancia al final, junto a `EntregaAutorizacionService`, que ya tiene esa misma dependencia tardía) invocado **síncronamente** desde `ActualizarEntregaUseCase` justo después de confirmar la Entrega — **decisión explícita de no usar el Event Bus para esto**, a diferencia de lo que sugería `docs/PLAN_IMPLEMENTACION.md` como opción preferida: la moderación IA (Sprint 4) es Should-have y tolera fallo silencioso por diseño (ADR-027), pero alcanzar el estado terminal de un flujo Must-have (RF-005 a RF-013) no debe depender de un listener best-effort — si fallara de forma asíncrona (como de hecho pasó con la IA_API_KEY inválida), el negocio se rompería sin que nadie se entere. Se agregan `Donacion.marcarEntregada()`, `Solicitud.marcarAtendida()`, `Trueque.marcarIntercambiado()` (mismo guard `estaFinalizada()` que ya usan `cancelar()`). Para `TRUEQUE`, cierra **ambos lados**: el origen (`entrega.idReferencia`) y el ofrecido (resuelto vía la propuesta `ACEPTADA`, mismo patrón que `EntregaAutorizacionService`). **Probado end-to-end contra Postgres real, los 3 flujos completos:** Donación (ofertar→auto-aceptar→confirmar entrega→`ENTREGADA`, y la Solicitud asociada→`ATENDIDA` simultáneamente) y Trueque (proponer→aceptar bilateral→confirmar entrega→ambos trueques `INTERCAMBIADO`). **Nota operativa detectada durante la prueba:** el contenedor `api` (Docker Desktop en Windows, bind mount) **no recargó automáticamente** tras editar los archivos fuente — `tsx watch` no disparó porque los eventos de `inotify` no siempre se propagan de forma confiable desde el filesystem de Windows a través del backend WSL2 hacia el contenedor Linux; fue necesario un `docker compose restart api` manual para que el código nuevo tomara efecto (la primera prueba, sin reiniciar, pasó silenciosamente con el código viejo — sin error, solo el estado no cambiaba). Se deja registrado como gotcha operativo de Sprint 5 para no repetir el diagnóstico. |
| 2026-07-08 | Sprint 5, parte 2/2 — Should-haves (Fase 11) + QA final, cierre del sprint y del roadmap de 5 sprints. **BC-Mensajería** (`domain/mensajeria/entities/Conversacion.ts`, aggregate real con invariante `esParticipante`, no un puerto sin entidad como Auditoría — sí hay reglas que proteger): decisión documentada porque Fase 4 no define `POST /conversaciones` — **`:id` en `POST/GET /conversaciones/:id/mensajes` es el otro participante, no un id de conversación**; la conversación se crea implícitamente al primer mensaje entre dos usuarios (`buscarPorParticipantes`), sin necesitar un endpoint de creación explícito; como el id siempre se construye a partir de `req.usuario.sub`, el requester siempre es un participante por construcción — sin chequeo de autorización adicional. **`NotificacionDispatchService`** (segundo listener real del Event Bus, el primero fue `ModeracionIAService` en Sprint 4): un método por cada uno de los 12 eventos de Fase 6 sección 5 + `RiesgoDetectado` (Sprint 4), doble canal (in-app siempre + correo vía n8n solo en los 7 eventos "de alto valor" de Fase 8 sección 5). Para resolver destinatarios de `EntregaProgramada`/`EntregaConfirmada`/`PublicacionModerada` se duplica la resolución mínima de partes en vez de importar `EntregaAutorizacionService` (capa `application`, prohibido desde un Domain Service). Se agrega `IUsuarioRepository.listarPorRol()` (no existía) para resolver administradores en `RiesgoDetectado`. **`N8nWebhookAdapter`** implementa el contrato exacto de Fase 8 sección 2 (`evento/entidad/entidadId/usuarioDestinoId/usuarioDestinoCorreo/datos/timestamp`), integración no bloqueante (mismo patrón RNF-002 que Cloudinary/Claude) — probado contra el contenedor `n8n` real: la petición llega correctamente (sin el workflow configurado en la UI de n8n, que es explícitamente configuración externa fuera de este documento, responde `404`) y el resultado queda registrado en `logs_n8n`. **Dashboard** (`DashboardQueryService`, `GET /dashboard/impacto`): combina conteos exactos de Postgres (reutilizando `listar(...).total`, sin nuevos métodos de repositorio) con la agregación Mongo de `eventos_sistema` (`$group`); **solo 3 eventos alimentan `eventos_sistema`** (`SolicitudAtendida`/`TruequeIntercambiado`/`EntregaConfirmada` — los únicos marcados "KPI" en la tabla de Fase 6 sección 5, no los 12 completos), consolidado dentro de `NotificacionDispatchService` en vez de un tercer listener separado. Colocación de `DashboardQueryService` en `domain/dashboard/` es una decisión de organización de carpetas no explícita en Fase 2 (que solo mapea CU-012 a "BC-Notificaciones/KPI transversal"). **Bug real encontrado y corregido:** Mongoose pluraliza automáticamente los nombres de modelo que no pasan un nombre de colección explícito — `analisis_ia` (Sprint 4), `eventos_sistema` y `logs_n8n` (Sprint 5) se estaban persistiendo silenciosamente en `analisis_ias`/`eventos_sistemas`/`logs_n8ns`, distintos de los nombres exactos documentados en Fase 3 sección 7.1.2; corregido pasando el nombre de colección explícito como 3er argumento de `model()` en los tres. **QA de cierre:** pruebas de integración Vitest+Supertest (`backend/tests/`) para los 3 flujos core (Donaciones crear→listar→cancelar; Solicitudes crear→ofertar→aceptar en un paso→Entrega automática; Trueques crear→proponer→aceptar bilateral→Entrega), con un helper que auto-crea una categoría vía ADMINISTRADOR si la base de datos está limpia (CI) en vez de depender de la semilla manual de Sprint 1; `.github/workflows/ci.yml` (ya existía con lint/typecheck/build) se extiende con un job `backend-test` con servicios Postgres 18.3/MongoDB 8.3.4 reales. `npm audit`: 8 vulnerabilidades, las 2 cadenas son de dev-time/install-time (`esbuild` vía `vitest`/`vite`; `tar` vía `@mapbox/node-pre-gyp` vía `bcrypt`), ninguna alcanzable desde la superficie de peticiones HTTP de la API en ejecución — riesgo aceptado y documentado en vez de forzar upgrades breaking (`vitest@4`, `bcrypt@6.0.0`) sin poder re-verificar compatibilidad. **`Dockerfile` corregido** (gap señalado explícitamente en `docs/PLAN_IMPLEMENTACION.md` desde Sprint 1): el `CMD` ahora corre `prisma generate && prisma migrate deploy` en cada arranque del contenedor, no solo en build — verificado con un ciclo completo `docker compose down -v && docker compose up --build` seguido de los 6 tests de integración, sin ningún paso manual oculto. **Sprint 5 cierra el roadmap de 5 sprints de `docs/PLAN_IMPLEMENTACION.md`.** |
| 2026-07-08 | **Cambio de proveedor de IA:** `adapters/ia/external/GeminiAdapter.ts` (`@google/genai`) reemplaza a `ClaudeAdapter` como adapter cableado en `main/di-container.ts` — mismo puerto `IIAProvider`, sin cambios en `domain/`/`application/`. `IAProviderNoConfiguradoError` se mueve de `ClaudeAdapter.ts` a `domain/ia/ports/IIAProvider.ts` (compartida entre ambos adapters, re-exportada desde `ClaudeAdapter.ts` para no romper imports existentes). Razón, modelos elegidos y desviación de ADR-024 documentados en `docs/fases/fase-07-inteligencia-artificial.md` historial. |
| 2026-07-08 | **Extensión post-cierre (Sprint F2 frontend, `docs/PLAN_FRONTEND.md`):** gap real detectado al construir la UI de Solicitudes/Entregas — ninguna respuesta (`SolicitudResponse`/`DonacionResponse`/`TruequeResponse`) expone el id de la Entrega asociada, y Fase 5 sección 2.5 exige que el frontend pueda mostrar/confirmar la coordinación desde el detalle de la publicación. Se agrega `IEntregaRepository.buscarPorReferencia(idReferencia)` (+ `PrismaEntregaRepository`) y `GET /entregas/por-referencia/:idReferencia` (`ObtenerEntregaUseCase.ejecutarPorReferencia`, misma autorización — partes involucradas o ADMINISTRADOR — que `GET /entregas/:id`, factorizada en un método privado común). Ruta estática declarada antes de `/entregas/:id` en `entregas.routes.ts` (Express resuelve por orden de declaración, a diferencia de React Router). No encontrar una Entrega para una referencia dada es un resultado válido (aún no hay oferta/propuesta aceptada), no un error de uso — el frontend trata el `404` de este endpoint específico como "sin entrega todavía". |
| 2026-07-09 | **Extensión post-cierre (Sprint F4 frontend, `docs/PLAN_FRONTEND.md`):** gap real detectado al construir el panel de Administración — Fase 4 solo definió `PATCH /admin/usuarios/:id/moderar` (moderar por id ya conocido), pero nunca un listado; `IUsuarioRepository` solo tenía `buscarPorId`/`buscarPorCorreo`/`listarPorRol` (este último ni siquiera expuesto por HTTP), así que la pestaña "Usuarios" no tenía forma de poblarse. Confirmado explícitamente con el usuario antes de construir (mismo criterio que la extensión de Entrega en F2, en vez de recurrir a un formulario "moderar por id" o posponer la pestaña). Se agrega `IUsuarioRepository.listar(filtros, paginacion)` (+ `UsuarioFiltros`/`Paginacion`/`ResultadoPaginado`, mismos tipos duplicados deliberadamente que ya usa `ITruequeRepository`, Fase 2 sección 2), `PrismaUsuarioRepository.listar` (mismo patrón `skip`/`take`/`count` que `PrismaTruequeRepository.listar`), `ListarUsuariosUseCase` nuevo en `application/administracion/` (consulta `usuarioRepository` directamente, no pasa por `ModeracionService` — ese servicio está scoped a acciones de moderación, no a listar), `AdminController.listarUsuarios` y `GET /admin/usuarios` (`soloAdministrador`). Verificado con curl: `200` con datos reales para un usuario ADMINISTRADOR, `403` para un usuario DONANTE. |

---

## 1. Estructura de módulos — Hexagonal + DDD + Clean Architecture (layer-first)

**Corrección de esta sección (2026-07-08, a pedido explícito del usuario tras revisar el código de Sprint 0):** las 4 capas van **al tope de `backend/`** (`backend/domain`, `backend/application`, `backend/adapters`, `backend/main`) en vez de anidadas dentro de `src/modules/<contexto>/` — cada Bounded Context es una subcarpeta *dentro* de cada capa, no al revés (ADR-046, refina ADR-042/044). Monolito modular (ADR-007) sin cambios — siguen siendo las mismas fronteras de módulo.

```
backend/
├── domain/
│   ├── identidad/
│   │   ├── entities/       (Usuario)
│   │   ├── value-objects/  (Rol, EstadoUsuario)
│   │   ├── events/         (UsuarioRegistrado)
│   │   └── ports/          (IUsuarioRepository, IPasswordHasher, ITokenService)
│   ├── categorias/
│   │   ├── entities/       (Categoria)
│   │   ├── value-objects/  (EstadoCategoria)
│   │   └── ports/          (ICategoriaRepository — Shared Kernel, Fase 2 sección 2)
│   ├── donaciones/
│   │   ├── entities/       (Donacion)
│   │   ├── value-objects/  (EstadoObjeto, EstadoDonacion)
│   │   └── ports/          (IDonacionRepository, IUbicacionRetiroRepository, IImagenRepository, ICloudStorage)
│   ├── auditoria/
│   │   └── ports/          (IAuditoriaRepository — sin entities/: log de solo-append, sin invariantes)
│   ├── solicitudes/
│   │   ├── entities/       (Solicitud — Oferta vive dentro del aggregate, sin repository propio)
│   │   ├── value-objects/  (Urgencia, EstadoSolicitud, EstadoOferta)
│   │   └── ports/          (ISolicitudRepository, IUbicacionSolicitudRepository)
│   ├── entregas/
│   │   ├── entities/       (Entrega)
│   │   ├── value-objects/  (EstadoEntrega, ModalidadEntrega, TipoOperacionEntrega)
│   │   ├── ports/          (IEntregaRepository)
│   │   └── services/       (EntregaCoordinacionService — Domain Service, invocado síncrono,
│   │                         compartido por Solicitudes y Trueques desde Sprint 3)
│   ├── trueques/
│   │   ├── entities/       (Trueque — PropuestaTrueque vive dentro del aggregate del trueque ORIGEN)
│   │   ├── value-objects/  (EstadoObjeto, EstadoTrueque, EstadoPropuesta)
│   │   └── ports/          (ITruequeRepository, IImagenRepository)
│   ├── ia/
│   │   ├── ports/          (IIAProvider — Open Host Service; IConversacionChatbotRepository,
│   │   │                     IAnalisisIARepository — MongoDB, Fase 3)
│   │   └── services/       (ChatbotOrquestacionService, ClasificacionService, MatchingService,
│   │                         ModeracionIAService — Domain Services, Fase 2 sección 6; sin
│   │                         entities/ propias, BC-IA no tiene aggregate transaccional)
│   ├── administracion/
│   │   └── services/       (ModeracionService — Domain Service, "Anti-corrupción/operación directa
│   │                         autorizada" sobre IUsuarioRepository/IDonacionRepository/
│   │                         ISolicitudRepository/ITruequeRepository, Fase 2 sección 2)
│   ├── mensajeria/
│   │   ├── entities/       (Conversacion — Aggregate Root real, invariante esParticipante; MongoDB)
│   │   └── ports/          (IConversacionRepository)
│   ├── notificaciones/
│   │   ├── ports/          (INotificacionRepository, IWebhookNotifier — n8n, Fase 8;
│   │   │                     IEventoSistemaRepository — KPI, solo 3 eventos "de cierre positivo")
│   │   └── services/       (NotificacionDispatchService — segundo listener real del Event Bus)
│   └── dashboard/
│       └── services/       (DashboardQueryService — CU-012/RF-019; placement no explícito en
│                             Fase 2, que solo mapea CU-012 a "BC-Notificaciones/KPI transversal")
├── application/
│   ├── identidad/
│   │   └── use-cases/      (RegistrarUsuarioUseCase, IniciarSesionUseCase, ObtenerPerfilUseCase)
│   ├── categorias/
│   │   └── use-cases/      (CrearCategoriaUseCase, ListarCategoriasUseCase, ActualizarCategoriaUseCase)
│   ├── donaciones/
│   │   └── use-cases/      (PublicarDonacionUseCase, ListarDonacionesUseCase, ObtenerDonacionUseCase,
│   │                         ActualizarDonacionUseCase, CancelarDonacionUseCase,
│   │                         FirmarSubidaImagenUseCase, RegistrarImagenUseCase)
│   ├── solicitudes/
│   │   └── use-cases/      (CrearSolicitudUseCase, ListarSolicitudesUseCase, ObtenerSolicitudUseCase,
│   │                         ActualizarSolicitudUseCase, CrearOfertaUseCase, ActualizarOfertaUseCase)
│   ├── entregas/
│   │   ├── use-cases/      (ObtenerEntregaUseCase, ActualizarEntregaUseCase)
│   │   └── services/       (EntregaAutorizacionService — resuelve "partes involucradas" cruzando
│   │                         Donaciones+Solicitudes o Trueques según tipoOperacion, ya que Entrega
│   │                         solo tiene referencia polimórfica; devuelve un array genérico de ids)
│   ├── trueques/
│   │   └── use-cases/      (PublicarTruequeUseCase, ListarTruequesUseCase, ObtenerTruequeUseCase,
│   │                         ActualizarTruequeUseCase, ProponerTruequeUseCase, ResponderPropuestaUseCase,
│   │                         FirmarSubidaImagenUseCase, RegistrarImagenUseCase)
│   ├── ia/
│   │   └── use-cases/      (ChatearUseCase, ObtenerConversacionUseCase, ClasificarUseCase,
│   │                         ObtenerMatchesUseCase — envoltorios delgados sobre los Domain Services,
│   │                         mismo criterio que ObtenerEntregaUseCase/EntregaAutorizacionService)
│   ├── administracion/
│   │   └── use-cases/      (ModerarPublicacionUseCase, ModerarUsuarioUseCase, ObtenerReportesUseCase)
│   ├── mensajeria/
│   │   └── use-cases/      (EnviarMensajeUseCase, ListarConversacionesUseCase, ListarMensajesUseCase)
│   ├── notificaciones/
│   │   └── use-cases/      (ListarNotificacionesUseCase, MarcarLeidoUseCase)
│   └── dashboard/
│       └── use-cases/      (ObtenerDashboardImpactoUseCase)
│   # auditoria/ no tiene application/ propio: se consume directamente vía el puerto (ver sección 3, retrofit)
├── adapters/
│   ├── identidad/
│   │   ├── controllers/    (auth.controller.ts, usuarios.controller.ts, schemas.ts)
│   │   ├── repositories/   (PrismaUsuarioRepository — implementa IUsuarioRepository)
│   │   └── security/       (BcryptPasswordHasher, JwtTokenService)
│   ├── categorias/
│   │   ├── controllers/    (categorias.controller.ts, schemas.ts)
│   │   └── repositories/   (PrismaCategoriaRepository)
│   ├── donaciones/
│   │   ├── controllers/    (donaciones.controller.ts, schemas.ts)
│   │   ├── repositories/   (PrismaDonacionRepository, PrismaUbicacionRetiroRepository, PrismaImagenRepository)
│   │   └── external/       (CloudinariaAdapter — implementa ICloudStorage, ADR-009; reutilizada
│   │                         directamente por Trueques, sin duplicar — puerto sin estado propio)
│   ├── auditoria/
│   │   └── repositories/   (PrismaAuditoriaRepository)
│   ├── solicitudes/
│   │   ├── controllers/    (solicitudes.controller.ts, schemas.ts)
│   │   └── repositories/   (PrismaSolicitudRepository, PrismaUbicacionSolicitudRepository)
│   ├── entregas/
│   │   ├── controllers/    (entregas.controller.ts, schemas.ts)
│   │   └── repositories/   (PrismaEntregaRepository)
│   ├── trueques/
│   │   ├── controllers/    (trueques.controller.ts, schemas.ts)
│   │   └── repositories/   (PrismaTruequeRepository, PrismaImagenRepository)
│   ├── ia/
│   │   ├── controllers/    (ia.controller.ts, schemas.ts)
│   │   ├── external/       (ClaudeAdapter — implementa IIAProvider, ADR-024)
│   │   └── repositories/   (MongooseConversacionChatbotRepository, MongooseAnalisisIARepository)
│   ├── administracion/
│   │   └── controllers/    (admin.controller.ts, schemas.ts)
│   ├── mensajeria/
│   │   ├── controllers/    (mensajeria.controller.ts, schemas.ts)
│   │   └── repositories/   (MongooseConversacionRepository — colección `mensajes`, Fase 3)
│   ├── notificaciones/
│   │   ├── controllers/    (notificaciones.controller.ts, schemas.ts)
│   │   ├── external/       (N8nWebhookAdapter — implementa IWebhookNotifier, Fase 8 ADR-028/031)
│   │   └── repositories/   (MongooseNotificacionRepository, MongooseLogsN8nRepository,
│   │                         MongooseEventoSistemaRepository)
│   └── dashboard/
│       └── controllers/    (dashboard.controller.ts)
│   # BC-Administración/Dashboard no tienen repositories/ propio: operan directamente sobre los
│   # repositories de Identidad/Donaciones/Solicitudes/Trueques (excepción de diseño, Fase 2)
└── main/                   ← composition root único, no se repite por módulo
    ├── express-app.ts        (middlewares globales: auth, rbac, validation, errorHandler, audit — Fase 9)
    ├── prisma-client.ts
    ├── mongoose-connection.ts  (agregado en Sprint 4 — primer módulo respaldado por Mongo: BC-IA)
    ├── event-bus.ts            (agregado en Sprint 4 con el primer listener real: ModeracionIAService;
    │                             Sprint 5 agrega el segundo, NotificacionDispatchService)
    ├── env.ts, logger.ts
    ├── di-container.ts        (wiring: adaptador concreto → puerto, por caso de uso)
    ├── middlewares/           (auth.middleware.ts, rbac.middleware.ts, error-handler.middleware.ts, audit.middleware.ts)
    └── routes/<módulo>.routes.ts  (uno por módulo, conecta verbos HTTP → controller)
```

**Regla de dependencia (Clean Architecture):** `domain/` no importa nada de `application/`, `adapters/` ni `main/`, ni de librerías externas (Prisma, Express, el SDK de Claude) — solo define **entidades DDD** y **puertos** (interfaces, ej. `IDonacionRepository`, `IIAProvider`). `application/` depende solo de `domain/` (orquesta llamando a puertos, sin saber qué los implementa). `adapters/` depende de `application/` + `domain/` — es la única capa que conoce Prisma/Mongoose/Express/Claude, implementa los puertos (**adaptadores de salida**, Hexagonal) y traduce peticiones HTTP a invocaciones de caso de uso (**adaptador de entrada**, Hexagonal). `main/` es la capa más externa: arma la inyección de dependencias y nunca contiene lógica de negocio.

**Resolución de imports entre capas:** como `domain/identidad/` y `application/identidad/` ya no son carpetas vecinas, los imports que cruzan de capa usan **path aliases de TypeScript** — `@domain/*`, `@application/*`, `@adapters/*`, `@main/*` (`tsconfig.json`, `paths`) — resueltos en producción con `tsc-alias` (paquete de build, ya que `tsc` no reescribe alias en el JS compilado; `tsx` en desarrollo los resuelve nativamente). Los imports dentro de la misma capa/módulo (ej. `domain/identidad/entities/` → `domain/identidad/value-objects/`) siguen usando rutas relativas simples.

Ningún módulo importa el `adapters/repositories` de otro módulo directamente — la comunicación cruzada pasa por el `application/use-cases` público del módulo o por eventos de dominio (respeta las fronteras de Bounded Context de Fase 2, sin cambios).

---

## 2. Casos de uso → orquestación de servicios

Cada CU se implementa como un **Application Service** (orquestador) que coordina Domain Services y Repositories, sin contener lógica de negocio propia (esa vive en el aggregate o en el Domain Service):

| CU | Orquestación (resumen de la secuencia) |
|---|---|
| CU-001 Registrarse | validar correo único → `bcrypt.hash` → `UsuarioRepository.crear` → emitir `UsuarioRegistrado` → `AutenticacionService.generarToken` |
| CU-002 Iniciar sesión | `UsuarioRepository.buscarPorCorreo` → `bcrypt.compare` → `AutenticacionService.generarToken` |
| CU-003 Publicar donación | validar DTO → (opcional) `ClasificacionService.sugerir` → `DonacionRepository.crear` (`PUBLICADA`) → emitir `DonacionPublicada` |
| CU-004 Subir fotografías | `CloudinariaAdapter.firmarSubida` → (cliente sube directo) → `ImagenRepository.registrarUrl` |
| CU-005 Crear solicitud | validar DTO → (opcional) `ClasificacionService.sugerir` → `SolicitudRepository.crear` (`ABIERTA`) → emitir `SolicitudCreada` |
| CU-006 Aceptar solicitud como donante | validar `solicitud.estado ∈ {ABIERTA, EN_REVISION}` → validar sin oferta activa → `OfertaRepository.crear` (`ACEPTADA`) → `SolicitudRepository.actualizarEstado(ACEPTADA_POR_DONANTE)` → `EntregaCoordinacionService.crearDesdeOferta` → emitir `SolicitudAceptadaPorDonante` |
| CU-007 Publicar objeto para trueque | análogo a CU-003 sobre `TruequeRepository` |
| CU-008 Proponer trueque | validar dueño del `truequeOfrecido` → validar `origen ≠ ofrecido` → `PropuestaRepository.crear` (`PENDIENTE`) → emitir `PropuestaTruequeRecibida` |
| CU-009 Conversar con chatbot IA | `ChatbotOrquestacionService.procesarMensaje` → `IAProviderAdapter.chat` → persistir en `chatbot_conversaciones` |
| CU-010 Coordinar entrega o retiro | `EntregaRepository.actualizarEstado` → emitir `EntregaProgramada`/`EntregaConfirmada` |
| CU-011 Administrar publicaciones | `ModeracionService.aprobar\|bloquear\|eliminar` → `AuditoriaService.registrar` → emitir `PublicacionModerada` |
| CU-012 Ver dashboard de impacto | `DashboardQueryService` — agregaciones de solo lectura sobre Postgres (counts por `estado_*`) + Mongo `eventos_sistema` |
| CU-013 Sugerencia de clasificación IA | `ClasificacionService.sugerir` → `IAProviderAdapter.clasificar` → log en `analisis_ia` |
| CU-014 Recomendaciones de coincidencia | `MatchingService.buscarCoincidencias` — filtra por categoría/ubicación/estado en Postgres, enriquece con score de `IAProviderAdapter` |
| CU-015 Enviar mensaje a otro usuario | `ConversacionRepository.agregarMensaje` (Mongo) → emitir evento interno → `NotificacionDispatchService` |
| CU-016 Recibir notificación del sistema | `NotificacionDispatchService` (listener de eventos) → `NotificacionRepository.crear` (Mongo) |

---

## 3. Servicios

**Ubicación en las 4 capas (sección 1):** los servicios "Dominio"/"Dominio (Generic)" viven en `domain/services/` (Domain Services DDD, capa 1 Entities) o como `application/use-cases/` (orquestación, capa 2); los servicios "Infraestructura" son **adaptadores** — viven en `adapters/` (capa 3, Interface Adapters) e implementan un puerto declarado en `domain/ports/`. La tabla no cambia de contenido, solo de ubicación física en el árbol de carpetas.

| Servicio | Tipo | Responsabilidad |
|---|---|---|
| `AutenticacionService` | Dominio | Login, emisión/validación JWT |
| `ModeracionService` | Dominio | Aprobar/bloquear/eliminar (RF-018) |
| `ClasificacionService` | Dominio (Generic) | Sugerencia de categoría/título/descripción vía IA |
| `MatchingService` | Dominio (Generic) | Coincidencias Solicitud↔Donación↔Trueque |
| `ChatbotOrquestacionService` | Dominio (Generic) | Gestión de conversación del chatbot |
| `EntregaCoordinacionService` | Dominio | Crea/gestiona Entrega desde Oferta/Propuesta aceptada |
| `NotificacionDispatchService` | Dominio (Generic) | Reacciona a eventos, decide qué notificar |
| `AuditoriaService` | Infraestructura | Registra en tabla `auditoria` (RNF-006) |
| `CloudinariaAdapter` | Infraestructura | Firma de subida (ADR-009) |
| `IAProviderAdapter` | Infraestructura | Fachada única al proveedor de IA (ADR-010) — oculta el proveedor concreto detrás de una interfaz de dominio (`clasificar`, `chat`, `matchScore`) |
| `MapsAdapter` | Infraestructura | Cálculo de distancia entre ubicaciones para `MatchingService` |
| `N8nWebhookAdapter` | Infraestructura | Traduce eventos de dominio a llamadas HTTP hacia n8n (Fase 8) |

Los 7 Application Services de la sección 2 (uno por CU relevante) orquestan estos servicios; no se listan aparte porque son 1:1 con la tabla de casos de uso.

---

## 4. Repositorios (puertos de salida + adaptadores)

Bajo el modelo de 4 capas (sección 1), cada "Repository" es en realidad dos artefactos: un **puerto** `I<Nombre>Repository` (interfaz, en `domain/ports/` del módulo dueño — capa 1, Entities) y un **adaptador** que lo implementa con Prisma o Mongoose (en `adapters/repositories/` del mismo módulo — capa 3, Interface Adapters) — uno por Aggregate Root (Fase 2, sección 5), tecnología fijada en ADR-008:

| Repository | Tecnología | Modelo(s) que gestiona |
|---|---|---|
| `UsuarioRepository` | Prisma (Postgres) | `usuarios`, `ubicaciones` |
| `CategoriaRepository` | Prisma (Postgres) | `categorias` |
| `DonacionRepository` | Prisma (Postgres) | `donaciones` |
| `SolicitudRepository` | Prisma (Postgres) | `solicitudes`, `ofertas_solicitud` |
| `TruequeRepository` | Prisma (Postgres) | `trueques`, `propuestas_trueque` |
| `EntregaRepository` | Prisma (Postgres) | `entregas` |
| `ImagenRepository` | Prisma (Postgres) | `imagenes` |
| `AuditoriaRepository` | Prisma (Postgres) | `auditoria` |
| `ConversacionRepository` | Mongoose (MongoDB) | `mensajes` |
| `NotificacionRepository` | Mongoose (MongoDB) | `notificaciones` |
| `ChatbotRepository` | Mongoose (MongoDB) | `chatbot_conversaciones` |
| `AnalisisIARepository` | Mongoose (MongoDB) | `analisis_ia`, `analisis_imagenes` |
| `EventoSistemaRepository` | Mongoose (MongoDB) | `eventos_sistema` |

Ningún `service`/caso de uso accede a Prisma/Mongoose directamente — siempre a través del puerto (`I<Nombre>Repository`), para poder sustituir el adaptador (ej. en tests, con un doble en memoria) sin tocar lógica de negocio ni el caso de uso.

---

## 5. Eventos

**Mecanismo:** Event Bus **in-process** (Node `EventEmitter` o equivalente ligero), no un message broker externo (Kafka/RabbitMQ/SQS). → **ADR-023**.

**Justificación:** al ser un monolito modular en un solo proceso (ADR-007) corriendo en localhost (ADR-000), un broker distribuido agrega infraestructura y latencia sin beneficio real; el Event Bus in-process ya desacopla los módulos (el emisor no conoce a los listeners) y es suficiente para orquestar los 12 eventos de dominio de Fase 2.

| Evento | Listeners |
|---|---|
| `UsuarioRegistrado` | `NotificacionDispatchService` |
| `DonacionPublicada` | `ClasificacionService` (auto-sugerencia), `N8nWebhookAdapter`, `NotificacionDispatchService` |
| `OfertaRecibida` | `NotificacionDispatchService` |
| `SolicitudAceptadaPorDonante` | `EntregaCoordinacionService` (ya invocado en la orquestación síncrona), `N8nWebhookAdapter`, `NotificacionDispatchService` |
| `SolicitudAtendida` | `NotificacionDispatchService`, agregación de KPI (`eventos_sistema`) |
| `TruequePublicado` | `MatchingService`, `N8nWebhookAdapter`, `NotificacionDispatchService` |
| `PropuestaTruequeRecibida` | `NotificacionDispatchService` |
| `TruequeAceptadoBilateralmente` | `EntregaCoordinacionService`, `N8nWebhookAdapter`, `NotificacionDispatchService` |
| `TruequeIntercambiado` | `NotificacionDispatchService`, KPI |
| `EntregaProgramada` | `NotificacionDispatchService` |
| `EntregaConfirmada` | `NotificacionDispatchService`, KPI |
| `PublicacionModerada` | `NotificacionDispatchService`, `AuditoriaService` |

Todo evento con listener `N8nWebhookAdapter` también queda registrado en `logs_n8n` (Fase 3) por el propio adapter tras la respuesta del webhook.

---

## 6. Integraciones (puertos de salida + adaptadores externos)

Mismo patrón que la sección 4, pero hacia servicios externos en vez de bases de datos: cada adapter implementa un puerto declarado en `domain/ports/` del módulo `ia` (`IIAProvider`, `ICloudStorage`, `IMapsProvider`, `IWebhookNotifier`) y vive en `adapters/external/` (capa 3, sección 1) de ese mismo módulo — los demás módulos lo consumen a través del caso de uso del módulo `ia`, no importándolo directamente (regla de frontera de Bounded Context, sección 1).

| Adapter | Método (contrato) | Entrada | Salida |
|---|---|---|---|
| `CloudinariaAdapter` | `firmarSubida(tipoEntidad, idEntidad, mimeType, tamañoBytes)` | metadatos del archivo | `{ signature, timestamp, apiKey, uploadPreset }` |
| `IAProviderAdapter` | `chat(mensaje, historial)` | texto + contexto | respuesta del chatbot |
| | `clasificar(titulo, descripcion)` | texto de la publicación | `{ categoriaSugerida, tituloSugerido, descripcionSugerida, prioridad }` |
| | `matchScore(entidadA, entidadB)` | dos publicaciones | score numérico |
| `MapsAdapter` | `calcularDistancia(ubicacionA, ubicacionB)` | dos coordenadas | distancia en km |
| `N8nWebhookAdapter` | `emitir(evento, payload)` | evento de dominio | resultado HTTP + log en `logs_n8n` |

Todas las integraciones externas fallan de forma **no bloqueante para el flujo principal** cuando es razonable (ej. si `ClasificacionService` falla, la publicación igual se crea sin sugerencia — coherente con RNF-002, que ya asume que el proveedor de IA puede no estar disponible). Las excepciones se capturan en el adapter y se registran en `analisis_ia`/`logs_n8n` con `estado: 'ERROR'`.

---

## 7. Middlewares transversales

`authMiddleware` (verifica JWT) → `rbacMiddleware(rolesPermitidos[])` (ADR-016) → `ownershipMiddleware` (valida dueño del recurso cuando aplica) → `validationMiddleware` (valida el DTO contra su schema Zod, ver ADR-022) → `controller` → `errorHandlerMiddleware` global (traduce excepciones a envelope de error, ADR-018) → `auditMiddleware` (post-hoc, solo en rutas marcadas como sensibles, RNF-006).

---

## 8. Decisiones de lenguaje y herramientas del backend

- **TypeScript** en todo el backend (no JavaScript plano). El SRS no lo exige ni lo prohíbe (solo pide "Node.js + Express.js"); se elige por el tipado fuerte que combina bien con Prisma (ADR-008) y reduce errores de integración en un plazo de 6 semanas. → **ADR-021**.
- **Zod** para validación de DTOs de entrada, reutilizando los mismos tipos inferidos de TypeScript. → **ADR-022**.

## 9. Estrategia de pruebas (RNF-009: "pruebas básicas de endpoints principales")

Pruebas de integración sobre los endpoints críticos de cada Bounded Context Core (Donaciones, Solicitudes, Trueques) más autenticación — no se exige cobertura exhaustiva, solo estos flujos: crear→listar→aceptar/proponer→aceptar bilateral/oferta→entrega. Herramientas concretas (Jest/Vitest + Supertest) se confirman al iniciar la implementación real, fuera del alcance de esta fase de diseño.

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-021 — Backend en TypeScript.
- ADR-022 — Zod como librería de validación de DTOs.
- ADR-023 — Event Bus in-process (no message broker externo).
- ADR-042 — Arquitectura hexagonal por módulo (decisión originada en Fase 1, aplicada aquí a la estructura de carpetas).
- ADR-044 — Las 4 capas explícitas de Clean Architecture (domain/application/adapters/main), combinando DDD + Hexagonal + Clean Architecture (decisión originada en Fase 1, aplicada aquí).
- ADR-046 — Estructura layer-first (capas al tope de `backend/`, Bounded Context como subcarpeta dentro de cada capa) con imports entre capas vía path aliases + `tsc-alias` (decisión originada en Fase 1, aplicada aquí).

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
