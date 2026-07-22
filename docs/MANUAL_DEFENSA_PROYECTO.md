# Manual de Defensa — DonaConnect Ecuador

Documento de apoyo para explicar y defender la arquitectura del proyecto: qué se construyó, por qué se construyó así, y cómo se comunican sus piezas. Complementa (no reemplaza) `docs/DECISIONES.md`, que es la fuente de verdad de cada decisión con su ADR.

---

## 1. Qué es el proyecto

**DonaConnect Ecuador** es una plataforma de donaciones, solicitudes de ayuda y trueque comunitario, con un chatbot de IA de apoyo. Nace de un SRS académico (`SRS_DonaConnect_Ecuador_ISO29148.docx`) y se diseñó en 14 fases documentadas (`docs/fases/`) antes de escribir una sola línea de código — arquitectura empresarial, DDD, modelo de datos, APIs, UX/UI, backend, IA, seguridad y DevOps quedaron aprobados en `docs/DECISIONES.md` (48 ADR) antes del Sprint 0.

Tres módulos de negocio (Bounded Contexts) forman el "marketplace": **Donaciones**, **Solicitudes** (con ofertas) y **Trueques** (con propuestas). Alrededor de ellos: Identidad (usuarios, auth), Entregas (coordina la logística de cierre de una donación/trueque), Mensajería, Notificaciones, IA (chatbot + clasificación + matching + moderación), Administración (panel de moderación) y Dashboard (KPIs de impacto).

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Backend runtime | Node.js | 22 LTS | Ejecuta el API |
| Backend lenguaje | TypeScript | 5.7 | Tipado end-to-end con Prisma; menos errores de integración |
| Backend framework | Express | 4.21 | Enrutamiento HTTP |
| Validación | Zod | 3.24 | Valida DTOs de entrada reusando tipos TS inferidos |
| Autenticación | jsonwebtoken + bcrypt | — | JWT stateless + hash de contraseñas |
| Base de datos relacional | **PostgreSQL** | 18.3 | Estado transaccional del negocio (usuarios, donaciones, solicitudes, trueques, entregas, categorías, auditoría) |
| ORM (Postgres) | Prisma | 6.1 | Migraciones versionadas + cliente tipado |
| Base de datos documental | **MongoDB** | 8.3.4 | Datos conversacionales/append-only (mensajería, notificaciones, eventos de sistema, historial de IA) |
| ODM (Mongo) | Mongoose | 9.7 | Estándar de facto para MongoDB en Node.js |
| Proveedor de IA | Google Gemini (`@google/genai`) | — | Chatbot, clasificación, matching, moderación asistida — ver §10 |
| Almacenamiento de imágenes | Cloudinary | — | Upload firmado directo desde el navegador, el backend nunca recibe el binario |
| Logging | Pino + pino-http | 9.6 | Logs estructurados en JSON |
| Seguridad HTTP | Helmet, CORS, rate limiting propio | — | Cabeceras seguras, origen restringido, límites de fuerza bruta |
| Testing backend | Vitest + Supertest | — | Tests unitarios y de integración HTTP |
| Frontend framework | React | 18.3 | SPA |
| Frontend build | Vite | 6.0 | Dev server + bundling |
| Frontend lenguaje | TypeScript | 5.7 | Igual que backend |
| Ruteo | React Router | 7.1 | Navegación SPA |
| Estado de servidor | TanStack Query | 5.62 | Cache, refetch, invalidación — sin Redux/Zustand |
| Tipografía | Fontsource (Inter, Sora) | — | Fuentes autoalojadas |
| Orquestación | Docker Compose | — | 4 servicios: `postgres`, `mongo`, `api`, `web` |
| CI | GitHub Actions | — | install → lint → typecheck → test → build (sin CD, entorno objetivo es localhost) |

---

## 3. Por qué esta arquitectura

La arquitectura del backend combina **tres patrones que resuelven problemas distintos y se usan juntos en la industria** (ADR-042, ADR-044):

- **DDD (Domain-Driven Design)** — decide *qué modelar*: el dominio se divide en Bounded Contexts (Identidad, Donaciones, Solicitudes, Trueques, Entregas, Mensajería, IA, Notificaciones, Administración, Dashboard, Categorías, Auditoría), cada uno con sus propias Entidades, Value Objects y reglas de negocio.
- **Clean Architecture** — decide *cómo se organizan las capas* y la **regla de dependencia**: las capas internas nunca conocen a las externas.
- **Hexagonal / Ports & Adapters** — decide *cómo el núcleo se conecta con el exterior*: el dominio define **puertos** (interfaces), y las implementaciones concretas (Prisma, Mongoose, Express, Gemini, Cloudinary) son **adaptadores** intercambiables.

**Por qué no microservicios (ADR-007):** el proyecto es un monolito modular. Microservicios exigirían orquestación, comunicación de red entre servicios y despliegue distribuido — infraestructura que no se justifica para un MVP académico de 6 semanas corriendo en `localhost`. La modularidad (fronteras claras entre Bounded Contexts) se logra igual, sin el costo operativo.

**Por qué igual vale la pena la Clean Architecture en un proyecto chico:** el dominio y los casos de uso quedan libres de dependencias de framework, lo que permite probarlos sustituyendo adaptadores por dobles de prueba, sin levantar Postgres/MongoDB/Gemini reales. Es la misma razón por la que existen los "puertos": `IUsuarioRepository`, `ITokenService`, `IConversacionRepository`, etc., son interfaces que el dominio define y que cualquier tecnología puede implementar.

### 3.1 Las 4 capas (de adentro hacia afuera)

```
backend/
├── domain/        Entidades, Value Objects, eventos, Domain Services, PUERTOS (interfaces)
├── application/    Casos de uso (orquestan el dominio a través de los puertos)
├── adapters/       Adaptadores: controllers HTTP, repositorios Prisma/Mongoose, clientes externos
└── main/           Composition Root: Express app, Prisma/Mongoose client, DI container, rutas
```

**Regla de dependencia:** `domain` no importa nada de las otras 3 capas. `application` solo depende de `domain` (a través de sus puertos). `adapters` implementa los puertos de `domain` y es usado por `application`. `main` es el único lugar que conoce a *todas* las capas — decide qué adaptador concreto se inyecta en cada caso de uso (`backend/main/di-container.ts`, ~430 líneas, es literalmente ese cableado explícito).

**Por qué "layer-first" y no "module-first" (ADR-046):** inicialmente cada Bounded Context tenía sus propias subcarpetas `domain/application/adapters`. Se cambió a que las 4 capas vivan al tope de `backend/` y cada contexto sea una subcarpeta *dentro* de cada capa (`domain/identidad/`, `application/identidad/`, `adapters/identidad/`) — así la arquitectura es visible apenas se abre el proyecto, sin entrar a un módulo específico. Los imports que cruzan de capa usan path aliases de TypeScript (`@domain/*`, `@application/*`, `@adapters/*`, `@main/*`) en vez de rutas relativas frágiles (`../../../domain/...`).

### 3.2 Frontend: arquitectura espejo

El frontend usa la misma idea de fronteras claras, adaptada a React (ADR-043, ADR-045):

```
frontend/src/
├── app/            Rutas globales (App.tsx), layouts (AppShell, RutaProtegida), páginas
├── features/<dominio>/   Un módulo por Bounded Context — mismo nombre que el backend
│   ├── api/        Llamadas HTTP con TanStack Query
│   ├── components/ Componentes específicos de ese dominio
│   ├── hooks/       Lógica extraída a hooks puros
│   └── types/       Tipos TS del dominio
└── shared/
    ├── components/{atoms,molecules,organisms}/   Solo si son puramente presentacionales
    ├── hooks/
    └── lib/         http-client.ts, utilidades transversales
```

**Regla de reutilización explícita:** un componente vive en `shared/` solo si recibe todo por props y no importa hooks/API de ningún `features/*`. Si depende de la lógica de un solo dominio, vive en `features/<dominio>/components/`, aunque internamente use piezas compartidas. Ejemplo real: `PublicacionCard` es compartida porque Donaciones/Solicitudes/Trueques la usan con la misma forma visual; `DonacionWizard` es específico porque orquesta pasos y validaciones propias de ese dominio.

Estilo funcional puro: solo function components, sin clases, lógica de negocio extraída a hooks, composición sobre herencia. Estado de servidor con **TanStack Query** (cache, invalidación, refetch); estado de UI puramente local con `useState`/`useReducer` — no se justifica Redux/Zustand para este alcance.

---

## 4. Cómo se comunican las capas — ejemplo real

Publicar una donación, de punta a punta:

```
1. Navegador       POST /api/v1/donaciones  (fetch, Authorization: Bearer <jwt>)
                          │
2. Express          main/routes/donaciones.routes.ts
                          │
3. authMiddleware    Verifica el JWT (ITokenService, puerto — no conoce la implementación
                     concreta JwtTokenService). Si falla → 401.
                          │
4. perfilMiddleware  ¿El usuario tiene el perfil DONANTE o COMUNIDAD en el token? Si no → 403.
                     (reemplaza al viejo rbacMiddleware para este módulo, ver §7)
                          │
5. auditMiddleware   Registra la acción en auditoría (Postgres) tras la respuesta.
                          │
6. Controller        adapters/donaciones/controllers/donaciones.controller.ts
                     Valida el body con Zod, llama al caso de uso.
                          │
7. Caso de uso        application/donaciones/use-cases/PublicarDonacionUseCase.ts
                     Orquesta el dominio: valida categoría, arma la entidad Donación,
                     pide persistirla — todo hablando contra INTERFACES (puertos).
                          │
8. Dominio            domain/donaciones/entities/Donacion.ts + Value Objects
                     Reglas de negocio puras, sin saber que existe Express o Prisma.
                          │
9. Adaptador de       adapters/donaciones/repositories/PrismaDonacionRepository.ts
   salida             Implementa IDonacionRepository — aquí sí se habla con Prisma/Postgres.
                          │
10. Event Bus         main/event-bus.ts emite 'DonacionPublicada' (in-process, ADR-023)
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
11a. ModeracionIAService              11b. NotificacionDispatchService
     (escucha el evento, llama a          (escucha el mismo evento, escribe en
      Gemini para pre-moderar,             MongoDB para que el feed in-app
      guarda en Mongo)                     del donante muestre la notificación)
```

**Por qué esto importa para la defensa:** ningún caso de uso conoce Prisma, Express o Gemini directamente — solo conoce interfaces (`IDonacionRepository`, `ITokenService`, `IIAProvider`). Eso es lo que permite, por ejemplo, tener **dos adaptadores de IA intercambiables** (`GeminiAdapter` y `ClaudeAdapter`, ambos implementan `IIAProvider`) sin tocar ni un caso de uso — cambiar de proveedor es una línea en `di-container.ts` (línea 290).

El **Event Bus interno** (`EventEmitter` de Node, no un broker externo como Kafka/RabbitMQ — ADR-023) es lo que desacopla módulos que, de otro modo, tendrían que llamarse directamente entre sí: cuando se publica una donación, ni `PublicarDonacionUseCase` ni el módulo de Donaciones saben que existe un módulo de Notificaciones o de Moderación IA — solo emiten un evento con nombre y payload, y quien esté escuchando reacciona.

---

## 5. Persistencia poliglota — por qué dos bases de datos

**Principio de frontera (Fase 1 / ADR-012):** *PostgreSQL = estado del negocio; MongoDB = todo lo demás.*

| PostgreSQL (relacional) | MongoDB (documental) |
|---|---|
| `usuarios`, `usuarios_perfiles` | `mensajes` (conversaciones de Mensajería) |
| `donaciones`, `solicitudes`, `ofertas`, `trueques`, `propuestas` | `notificaciones` (feed in-app) |
| `entregas`, `categorias`, `imagenes` | `eventos_sistema` (log de eventos de dominio) |
| `auditoria` | `chatbot_conversaciones` (historial del chatbot IA) |
| — | `analisis_ia` (resultados de moderación/clasificación IA) |

**Por qué esta división y no todo en una sola base (ADR-012):**
- Los datos en Postgres participan de **máquinas de estado** con invariantes estrictas (una Solicitud solo permite una Oferta `ACEPTADA_POR_DONANTE` activa a la vez; un Trueque solo una Propuesta `ACEPTADA` — ADR-011) y de relaciones (`FK`) que garantizan integridad referencial. Perder o corromper un registro aquí rompe el negocio.
- Los datos en Mongo son **conversacionales / append-only**: perder un mensaje o una notificación no corrompe ninguna máquina de estado. Su naturaleza (esquema flexible, escritura de alto volumen, sin relaciones fuertes entre sí) encaja mejor con un modelo documental que relacional.

**Otras decisiones sobre la capa de datos:**
- **UUID v4 como PK en Postgres, no enteros autoincrementales (ADR-013):** evita que la API exponga IDs enumerables (`/donaciones/1`, `/donaciones/2`...) — mitiga *Broken Access Control* (OWASP), relevante porque hay datos sensibles de ubicación de usuarios.
- **Referencias polimórficas sin FK declarativa (ADR-015):** `entregas.id_referencia` puede apuntar a una `donacion` o a un `trueque`; Postgres no soporta FK polimórficas nativas, así que la validación de que la entidad referenciada existe se hace en la capa de servicio del backend, documentando el trade-off en vez de triplicar tablas.
- **Retención en MongoDB (ADR-014):** TTL index de 90 días para `eventos_sistema` (antes también `logs_n8n`, ver §11); sin expiración para `chatbot_conversaciones` y `analisis_ia`, que tienen valor histórico para mejorar matching/clasificación.
- **Prisma para Postgres + Mongoose para Mongo (ADR-008):** Prisma da migraciones versionadas y tipado fuerte (crítico para las FK exigidas por el modelo relacional); Mongoose es el estándar de facto para MongoDB en Node.js y está mencionado explícitamente en el SRS del proyecto.

---

## 6. Autenticación y autorización

**JWT como Bearer token** (`Authorization: Bearer <token>`), guardado en `sessionStorage` del navegador — no `localStorage` ni cookies `httpOnly` (ADR-032). Se optó por no migrar a cookies `httpOnly` + CSRF (el patrón más recomendado por OWASP para SPAs) porque hubiera reabierto una fase de diseño ya aprobada y añadido complejidad no justificada para el plazo académico; el riesgo de XSS se mitiga con CSP restrictiva (Helmet), expiración corta del token (8 horas, sin refresh token — ADR-033) y `sessionStorage` en vez de `localStorage`.

### 6.1 Rol vs Perfil Funcional — el diseño más reciente del proyecto (ADR-048)

Este es probablemente el punto más defendible del proyecto porque nació de una auditoría real y corrigió un modelo que ya no alcanzaba:

- **Antes:** `usuarios.rol` tenía 4 valores (`ADMINISTRADOR | DONANTE | BENEFICIARIO | USUARIO_COMUNIDAD`), mezclando seguridad con capacidad de negocio. Un usuario no podía ser Donante *y* Solicitante *y* Trueque a la vez sin convertirse en `USUARIO_COMUNIDAD` (el "rol que puede todo") — evidencia de que el modelo de un solo valor ya se había quedado corto.
- **Ahora:** `Rol` se redujo a **2 valores puros de seguridad** — `ADMINISTRADOR | USUARIO` (`domain/identidad/value-objects/Rol.ts`). Se agregó `PerfilFuncional` — `DONANTE | SOLICITANTE | TRUEQUE | COMUNIDAD` (`domain/identidad/value-objects/PerfilFuncional.ts`) — como concepto **independiente**, en una tabla 1-a-muchos (`usuarios_perfiles`): un usuario puede tener 0, 1 o los 4 perfiles simultáneamente.

**Dos middlewares con el mismo patrón, propósitos distintos:**
- `rbacMiddleware` — verifica el `Rol` de seguridad. Sigue vigente, acotado exclusivamente a rutas de `ADMINISTRADOR` (panel admin, categorías).
- `perfilMiddleware` — verifica pertenencia a un array de `PerfilFuncional`. Reemplazó a `rbacMiddleware` en las rutas de Donaciones/Solicitudes/Trueques.

Ejemplo real (`main/routes/donaciones.routes.ts`): `perfilMiddleware(['DONANTE', 'COMUNIDAD'])` protege `POST /donaciones` — antes era `rbacMiddleware(['DONANTE', 'USUARIO_COMUNIDAD'])`.

**Ambos van embebidos en el JWT en cada login** (`rol` y `perfiles`), evitando una consulta extra a base de datos en cada request protegido.

**Opciones descartadas (vale la pena mencionarlas si preguntan "por qué no...")**:
- *Permisos sobre el rol actual* — no resolvía el problema de fondo, repetía el mismo parche.
- *Renombrar roles* — mismo problema si siguen siendo de un solo valor.
- *Motor de permisos genérico* — alcance mayor al problema real (4 perfiles concretos y conocidos de antemano, no decenas de permisos finos).

**Efecto colateral positivo de esta migración:** se corrigió un hallazgo de seguridad real — el registro público antes aceptaba `rol: 'ADMINISTRADOR'` sin ninguna verificación adicional. Ahora el registro recibe `perfiles[]` (capacidad de marketplace), y el rol de seguridad nunca lo elige el propio usuario.

**Migración de datos:** se aplicó con patrón *expand-and-contract* (columna temporal + `CASE` explícito + rename), no un cast directo — un cast directo de un enum de 4 a 2 valores rompe si ya existen filas con los valores que se están quitando. 23 usuarios reales migrados sin incidentes (5 `ADMINISTRADOR`, 18 `USUARIO`).

**Decisión de UX explícita:** el menú de navegación **no** se filtra por perfil — Donaciones/Solicitudes/Trueques son navegación pública para cualquier usuario autenticado; los perfiles solo condicionan los *botones de acción* (+Publicar, +Ofertar, +Proponer).

---

## 7. Comunicación Frontend ↔ Backend

Todo pasa por `frontend/src/shared/lib/http-client.ts`, un cliente `fetch` centralizado:

- Adjunta `Authorization: Bearer <token>` automáticamente en cada request (token leído de `sessionStorage`).
- Normaliza **todos** los errores (de red, HTTP, o JSON inválido) a una única clase `ApiError` — la UI nunca ve un `TypeError: Failed to fetch` crudo del navegador.
- Respeta el **envelope estándar** acordado en el diseño de API (ADR-018): listados devuelven `{ data, meta: { page, limit, total, totalPages } }`; errores devuelven `{ error: { code, message, details } }` con mensajes en español.
- Versionado de API vía URL — todo bajo `/api/v1` (ADR-017), simple, cacheable, sin necesidad de negociar versión por cabecera para un único cliente (el propio frontend).

Del lado del backend, CORS está restringido a `CORS_ORIGIN` (por defecto `http://localhost:5173`, el puerto de Vite) — no acepta cualquier origen.

---

## 8. Inteligencia Artificial

**Regla de oro (ADR-010): el frontend nunca llama directamente al proveedor de IA.** Toda solicitud pasa por una fachada en el backend (`IAProviderAdapter` detrás del puerto `IIAProvider`). Esto protege la API key, permite logging centralizado en MongoDB y habilita rate limiting/control de costos.

**Proveedor actual: Google Gemini**, no Anthropic Claude, aunque el diseño original (ADR-024) eligió Claude. El cambio fue pragmático — acceso a una API key gratuita de Gemini — y no rompió nada porque **ambos adaptadores implementan la misma interfaz `IIAProvider`** (`GeminiAdapter` y `ClaudeAdapter` conviven en `adapters/ia/external/`; cambiar de proveedor es una sola línea en `main/di-container.ts`). Esto es la prueba práctica de por qué vale la pena la arquitectura hexagonal incluso en un proyecto chico.

**4 casos de uso de IA:**
1. **Chatbot** (`ChatbotOrquestacionService`) — conversación de apoyo al usuario, historial en `chatbot_conversaciones` (Mongo).
2. **Clasificación** (`ClasificacionService`) — sugiere categoría para una publicación nueva.
3. **Matching** (`MatchingService`) — sugiere coincidencias entre donaciones/solicitudes/trueques.
4. **Moderación asistida** (`ModeracionIAService`) — escucha eventos del Event Bus (`DonacionPublicada`, `SolicitudCreada`, `TruequePublicado`) y marca riesgo en `analisis_ia`, **sin bloquear nunca la publicación** — principio *human-in-the-loop* (ADR-010/027): la IA solo asiste, el administrador humano decide.

**Salida estructurada, no texto libre (ADR-025):** Clasificación y Matching usan JSON Schema contra el modelo, con el `enum` de categorías consultado en vivo contra la tabla `categorias` — nunca parsing de texto libre de la respuesta del modelo. Garantiza que la IA nunca sugiera una categoría inexistente.

**Sin RAG (ADR-026):** el corpus de conocimiento del chatbot es pequeño y estático, así que se embebe directo en el system prompt (con `cache_control: ephemeral` para abaratar llamadas repetidas) en vez de montar una base de datos vectorial y un pipeline de indexación que agregaría infraestructura sin beneficio real a esta escala.

---

## 9. Seguridad — resumen defendible

- **RBAC + Perfiles Funcionales** — ver §6.1.
- **UUID v4** como PK en Postgres — evita enumeración de recursos.
- **Ubicación exacta oculta por defecto (ADR-019):** los endpoints públicos de donaciones nunca devuelven `latitud`/`longitud`/`referencia` exactos; solo `provincia`/`ciudad`/`sector`. El dato exacto solo se incluye si quien pregunta es el propio donante, el beneficiario con oferta aceptada, o un administrador — la regla vive a nivel de DTO/serializador, no confiada al frontend.
- **Rate limiting diferenciado (ADR-034):** login/registro por IP (5/15min, 10/hora) contra fuerza bruta; IA por usuario (20-30/min) para controlar costo con el proveedor externo; resto de la API a 100 req/min por IP contra scraping/abuso genérico.
- **Helmet** (cabeceras HTTP seguras) + **CORS restringido** a un único origen conocido.
- **bcrypt** para hash de contraseñas, nunca texto plano ni un algoritmo reversible.
- **Auditoría transversal:** `auditMiddleware` registra en Postgres quién hizo qué acción sensible (crear/cancelar donación, etc.), con `request_id` correlacionado en los logs de Pino.
- **Excepción documentada, no ignorada:** el entorno corre sobre HTTP en `localhost` (no HTTPS) porque el tráfico académico no sale de la máquina de evaluación (ADR-006) — se declaró como excepción explícita al requisito de HTTPS del SRS, no como un olvido.

---

## 10. DevOps

`docker-compose.yml` levanta 4 servicios en una red interna (`donaconnect-network`):

| Servicio | Imagen | Puerto host | Rol |
|---|---|---|---|
| `postgres` | `postgres:18.3-alpine` | 5433→5432 | Estado del negocio |
| `mongo` | `mongo:8.3.4` | 27017 | Datos documentales |
| `api` | build de `./backend` | 4000 | Backend Express |
| `web` | build de `./frontend` | 5173 | Frontend Vite |

`api` espera a que `postgres` pase su healthcheck (`pg_isready`) antes de arrancar. `web` depende de `api`. Variables de entorno completas documentadas en ADR-038 (incluye `MAPS_API_KEY`, credenciales de Cloudinary desglosadas, `CORS_ORIGIN`, `PORT`, `NODE_ENV`).

**CI sin CD (ADR-036):** GitHub Actions corre `install → lint → typecheck → test → build` en cada push/PR — sigue aportando valor de calidad (detectar errores antes de fusionar) aunque no exista un destino de despliegue continuo real, porque el entorno objetivo es `localhost` (ADR-000).

**n8n fue removido por completo del proyecto (ADR-047, 2026-07-10):** estaba planeado como capa de automatización para envío de correo, pero el workflow nunca se terminó de configurar en la UI (la petición devolvía 404) — se prefirió una base de código más simple que dejar una integración a medio construir. Notificaciones quedan **solo in-app** (Mongo), sin canal de correo.

---

## 11. Preguntas frecuentes de defensa (Q&A)

**¿Por qué dos bases de datos y no una sola?**
Porque tienen requisitos distintos de integridad: Postgres protege máquinas de estado con invariantes estrictas (relaciones, unicidad, FK); Mongo guarda datos append-only donde perder un registro no corrompe el negocio. Ver §5.

**¿Por qué no usar Redux/Zustand en el frontend?**
Porque casi todo el estado de la app es *estado de servidor* (datos que vienen del API), y TanStack Query ya resuelve cache, invalidación y refetch para ese caso mejor que una store manual. El estado verdaderamente local (un formulario, un modal abierto) no necesita una librería global.

**¿Qué pasa si Gemini/Cloudinary/Mapas están caídos o sin configurar?**
El backend no bloquea el resto de la API — los adaptadores externos degradan a un error controlado (`IAProviderNoConfiguradoError`, mismo patrón para `CloudinariaAdapter`) solo cuando se invoca esa funcionalidad puntual, sin tumbar el resto del sistema (RNF-002).

**¿Por qué JWT en `sessionStorage` y no cookies `httpOnly`?**
Es un trade-off documentado, no un descuido: cookies `httpOnly` + CSRF es más seguro en teoría, pero hubiera reabierto una fase de diseño ya cerrada y agregado complejidad no justificada para 6 semanas. Se mitiga el riesgo de XSS con CSP (Helmet), expiración corta (8h) y `sessionStorage` en vez de `localStorage`. Ver ADR-032.

**¿Por qué el rol de seguridad y el perfil funcional son cosas distintas?**
Porque mezclarlos obligaba a un enum combinatorio (hasta 15 valores no vacíos con 4 capacidades) para representar "Donante + Solicitante + Trueque" en un mismo usuario. Separarlos permite que un usuario tenga 0 a 4 perfiles con una tabla 1-a-muchos simple, sin tocar el modelo de seguridad. Ver §6.1 / ADR-048.

**¿Cómo se garantiza que el dominio no dependa de Express o Prisma?**
Los casos de uso (`application/`) solo reciben *interfaces* (puertos) en su constructor — nunca importan `express` ni `@prisma/client` directamente. La implementación concreta se decide una sola vez, en `main/di-container.ts` (el *composition root*). Es la Regla de Dependencia de Clean Architecture aplicada literalmente.

**¿Por qué un Event Bus in-process y no Kafka/RabbitMQ?**
Porque el backend es un monolito modular en un solo proceso — un broker distribuido agregaría infraestructura que no se necesita a esta escala (ADR-023). El acoplamiento que sí importa evitar (que el módulo de Donaciones tenga que conocer al de Notificaciones) ya se resuelve con eventos in-process.

**¿Qué se sacrifica al no tener microservicios?**
Escalado independiente por módulo y despliegue independiente — ninguno de los dos es un requisito real para un MVP académico en `localhost`. A cambio se gana simplicidad operativa real: un solo build, un solo deploy, sin coordinación de red entre servicios.

---

## 12. Glosario rápido de patrones

- **Bounded Context (DDD):** un módulo de negocio con su propio lenguaje y reglas (ej. "Trueque" y "Solicitud" son contextos distintos aunque ambos muevan objetos entre usuarios).
- **Entidad / Value Object (DDD):** una Entidad tiene identidad propia y ciclo de vida (`Donacion`, con su `id`); un Value Object se define por su valor, es inmutable (`Rol`, `PerfilFuncional`, `Urgencia`).
- **Puerto (Hexagonal):** una interfaz que el dominio define para algo que necesita del exterior (`IDonacionRepository`, `ITokenService`, `IIAProvider`).
- **Adaptador (Hexagonal):** la implementación concreta de un puerto (`PrismaDonacionRepository`, `JwtTokenService`, `GeminiAdapter`).
- **Caso de uso (Clean Architecture):** una acción de negocio completa, orquestando el dominio a través de puertos (`PublicarDonacionUseCase`).
- **Composition Root:** el único lugar del programa que sabe qué adaptador concreto va en cada puerto y arma todo el grafo de dependencias (`main/di-container.ts`).
- **Repository (patrón):** abstrae el acceso a datos detrás de una interfaz orientada al dominio, sin exponer detalles de SQL/Mongo a quien la usa.
- **Event Bus:** mecanismo de publicación/suscripción que desacopla quién genera un evento de negocio de quién reacciona a él.

---

*Última actualización: 2026-07-16, verificado contra el código real del repositorio (no solo contra el diseño de `docs/fases/`).*
