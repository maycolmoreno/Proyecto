# Fase 6 — Backend

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** Fases 0-5 + `docs/DECISIONES.md`

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Estructura de módulos, orquestación de los 16 casos de uso, servicios de dominio/aplicación/infraestructura, repositorios, mecanismo de eventos e integraciones. Se fija TypeScript, Zod y Event Bus in-process. Aún sin código — solo diseño de implementación. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 7. |
| 2026-07-07 | Corrección de arquitectura a pedido del usuario: la estructura de módulos (sección 1) pasa de capas técnicas (`routes/controllers/services/repositories`) a **arquitectura hexagonal** (`domain/application/infrastructure`) por Bounded Context, aplicando la decisión fijada en Fase 1 (ADR-042). Servicios, repositorios e integraciones (secciones 3-6) no cambian de responsabilidad, solo se reencuadran como puertos/adaptadores. |
| 2026-07-07 | Refinamiento a pedido del usuario ("Arquitectura Hexagonal + DDD + Clean Architecture PARA EL API"): sección 1 pasa a las **4 capas explícitas de Clean Architecture** (`domain/application/adapters` por módulo + `main/` como composition root único), alineada con Fase 1 sección 10 (ADR-044). Secciones 3, 4 y 6 actualizan sus referencias de carpeta (`infrastructure/` → `adapters/`). |
| 2026-07-08 | Corrección a pedido del usuario tras ver el código de Sprint 0: sección 1 pasa a **estructura layer-first** — capas al tope de `backend/`, Bounded Context como subcarpeta dentro de cada capa. Se documenta la resolución de imports entre capas vía path aliases + `tsc-alias` (ADR-046, refina ADR-042/044). Aplicado y verificado en el código real. |

---

## 1. Estructura de módulos — Hexagonal + DDD + Clean Architecture (layer-first)

**Corrección de esta sección (2026-07-08, a pedido explícito del usuario tras revisar el código de Sprint 0):** las 4 capas van **al tope de `backend/`** (`backend/domain`, `backend/application`, `backend/adapters`, `backend/main`) en vez de anidadas dentro de `src/modules/<contexto>/` — cada Bounded Context es una subcarpeta *dentro* de cada capa, no al revés (ADR-046, refina ADR-042/044). Monolito modular (ADR-007) sin cambios — siguen siendo las mismas fronteras de módulo.

```
backend/
├── domain/
│   └── identidad/
│       ├── entities/       (Usuario)
│       ├── value-objects/  (Rol, EstadoUsuario)
│       ├── events/         (UsuarioRegistrado)
│       └── ports/          (IUsuarioRepository, IPasswordHasher, ITokenService)
├── application/
│   └── identidad/
│       └── use-cases/      (RegistrarUsuarioUseCase, IniciarSesionUseCase)
├── adapters/
│   └── identidad/
│       ├── controllers/    (auth.controller.ts, usuarios.controller.ts, schemas.ts)
│       ├── repositories/   (PrismaUsuarioRepository — implementa IUsuarioRepository)
│       └── security/       (BcryptPasswordHasher, JwtTokenService)
│   # próximos módulos (Sprint 1+) agregan su propia subcarpeta aquí:
│   # domain/donaciones/, application/donaciones/, adapters/donaciones/...
└── main/                   ← composition root único, no se repite por módulo
    ├── express-app.ts        (middlewares globales: auth, rbac, validation, errorHandler, audit — Fase 9)
    ├── prisma-client.ts
    ├── mongoose-connection.ts  (se agrega cuando el primer módulo respaldado por Mongo lo necesite)
    ├── event-bus.ts            (event bus in-process, ver sección 5 — se agrega con el primer listener real)
    ├── env.ts, logger.ts
    ├── di-container.ts        (wiring: adaptador concreto → puerto, por caso de uso)
    ├── middlewares/           (auth.middleware.ts, rbac.middleware.ts, error-handler.middleware.ts)
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
