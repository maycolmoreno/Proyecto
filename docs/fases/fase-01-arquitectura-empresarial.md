# Fase 1 — Arquitectura Empresarial

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` v1.0 + `docs/DECISIONES.md`

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Define los 10 componentes de arquitectura exigidos por el Plan Maestro: lógica, física, despliegue, seguridad, integración, IA, automatización, persistencia, frontend, backend. Se agregan ADR-006 a ADR-010. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 2. |
| 2026-07-07 | Corrección de versiones a pedido del usuario: PostgreSQL 16.x → 18.3, MongoDB 6.x → 8.3.4 (ver ADR-039/ADR-040). |
| 2026-07-07 | Corrección de arquitectura a pedido del usuario: sección 10 (Backend) pasa de capas simples a **arquitectura hexagonal** por módulo (ADR-042); sección 9 (Frontend) pasa a **arquitectura funcional + modular (feature-based)**, cerrando además la decisión diferida de data-fetching con TanStack Query (ADR-043). |
| 2026-07-07 | Refinamiento a pedido del usuario ("Arquitectura Hexagonal + DDD + Clean Architecture PARA EL API"): sección 10 pasa de 3 carpetas (domain/application/infrastructure) a las **4 capas explícitas de Clean Architecture** (domain/application/adapters/main), con tabla de mapeo DDD ↔ Clean ↔ Hexagonal y la Regla de Dependencia explícita (ADR-044, refina ADR-042). |
| 2026-07-07 | Refinamiento a pedido del usuario ("Frontend: arquitectura funcional + feature-based architecture + componentes reutilizables"): sección 9 se reorganiza en 3 subsecciones explícitas (9.1 feature-based, 9.2 funcional, 9.3 componentes reutilizables), formalizando `shared/components/` en niveles atómicos (atoms/molecules/organisms) con una regla explícita de qué califica como reutilizable (ADR-045, refina ADR-043). |
| 2026-07-08 | Corrección a pedido del usuario tras ver la implementación de Sprint 0: sección 10 pasa de `src/modules/<contexto>/{domain,application,adapters}` a **estructura layer-first** — `backend/domain`, `backend/application`, `backend/adapters`, `backend/main` al tope, con el Bounded Context como subcarpeta dentro de cada capa. Se agrega la resolución de imports entre capas vía path aliases + `tsc-alias` (ADR-046, refina ADR-042/044). Aplicado y verificado en el código de Sprint 0. |

---

## 1. Arquitectura lógica

**Decisión:** **Monolito modular** organizado por dominios funcionales (no microservicios).

Capas (coherentes con Apéndice B.3 del SRS):
```
Presentación (React + Vite)
        │  HTTPS/JSON
        ▼
API (Node.js + Express) ── middlewares transversales (auth, RBAC, validación, auditoría)
        │
        ▼
Capa de negocio — módulos por dominio:
  usuarios · donaciones · solicitudes · trueques
  ia · ubicacion · administracion · mensajeria · notificaciones
        │
        ├── Persistencia relacional (PostgreSQL 18.3) — estado transaccional
        ├── Persistencia NoSQL (MongoDB 8.3.4) — IA, logs, eventos
        ├── Automatización (n8n) — orquestación asíncrona
        └── Servicios externos — IA, Cloudinary, Mapas
```

**Justificación:** RNF-009 exige arquitectura modular capaz de separar frontend/backend/persistencias/servicios externos, y RNF-010 exige organización por módulos (usuarios, donaciones, solicitudes, trueques, IA, ubicación, administración). Un monolito modular cumple ambos sin la complejidad operativa de microservicios (service discovery, mensajería entre servicios, despliegue distribuido), que no se justifica para un MVP académico de 6 semanas ejecutado en localhost (ADR-000). Los límites de módulo se definen con fronteras claras (ver Fase 2 - DDD) para permitir una futura extracción a microservicios si el proyecto escalara — sin pagar ese costo ahora. → **ADR-007**.

**Módulos añadidos respecto al SRS original:** `mensajeria` y `notificaciones` se separan como módulos propios porque generan casos de uso propios (CU-015, CU-016, ver Fase 0 / ADR-005) aunque no tengan tabla dedicada explícita en §7.1.1 — se ubican dentro del dominio de `entregas`/`eventos_sistema` ya existentes en el SRS.

---

## 2. Arquitectura física

**Decisión:** Todo el sistema corre en **una sola máquina (localhost)** mediante contenedores Docker, sin infraestructura distribuida.

| Componente | Contenedor | Puerto sugerido |
|---|---|---|
| Frontend (build servido o dev server) | `web` | 5173 |
| Backend API | `api` | 4000 |
| PostgreSQL 18.3 | `postgres` | 5432 |
| MongoDB 8.3.4 | `mongo` | 27017 |
| n8n | `n8n` | 5678 |

**Nota importante (riesgo documentado):** IA provider, Cloudinary y el servicio de Mapas son **SaaS externos** (§2.6.2) — no se pueden ejecutar en localhost. El sistema seguirá dependiendo de conectividad a internet para RF-014, RF-015, RF-016, RF-006 y RF-007, incluso corriendo todo lo demás localmente. Esto ya estaba identificado como riesgo en Fase -1 (dependencia de terceros) y no cambia con la decisión de localhost.

---

## 3. Arquitectura de despliegue

**Decisión:** Orquestación con **Docker Compose** (single-host), sin Kubernetes ni pipelines de despliegue cloud — coherente con ADR-000.

- Un único `docker-compose.yml` levanta `web`, `api`, `postgres`, `mongo`, `n8n` en una red bridge común.
- Variables de entorno (§7.3) gestionadas vía `.env` no versionado: `JWT_SECRET`, `DB_POSTGRES_URL`, `MONGODB_URI`, `IA_API_KEY`, `CLOUDINARY_KEYS`, `N8N_WEBHOOK_URL`, más clave del servicio de mapas.
- Volúmenes persistentes para `postgres` y `mongo` (evitar pérdida de datos entre reinicios durante evaluación académica).
- No se define reverse proxy (nginx) ni balanceo de carga: no aporta valor en un entorno de un solo usuario evaluador en localhost (principio YAGNI). Se documenta como posible extensión futura si el proyecto pasara a producción real.

---

## 4. Arquitectura de seguridad

Basada en JWT + RBAC + OWASP Top 10, tal como exige el SRS (§2.5, RNF-004/005/006):

- **Autenticación:** JWT firmado con `JWT_SECRET`, expiración configurable (RF-002).
- **Autorización:** middleware RBAC por rol (Administrador, Donante, Beneficiario, Usuario Comunidad — RF-003), aplicado a nivel de ruta y de campo (ej. ubicación exacta del donante solo visible para el propio donante y el sistema, nunca en respuestas públicas — RNF-011).
- **Contraseñas:** bcrypt, nunca texto plano (RNF-005).
- **Auditoría:** toda operación sensible (crear/aprobar/cancelar/eliminar) registra usuario, fecha, acción y entidad (RNF-006) — se persiste en Postgres (tabla de auditoría) por ser estado transaccional crítico, no en Mongo.
- **OWASP Top 10 (§2.5):** validación de entrada en middlewares, queries parametrizadas vía ORM (previene inyección SQL), `helmet` para cabeceras HTTP, CORS restringido al origen del frontend, límite de tamaño de archivo 5 MB y validación de MIME type en carga de imágenes (§5.4), sanitización de texto libre en mensajería/chatbot para prevenir XSS almacenado, rate limiting básico en endpoints de autenticación.
- **HTTPS (RNF-004, TLS 1.2+):** obligatorio en el SRS para toda comunicación cliente-servidor. En **localhost académico** se documenta como excepción justificada: el tráfico no sale de la máquina del evaluador, por lo que se ejecuta sobre HTTP en desarrollo; queda documentado que un despliegue real requeriría TLS terminado en reverse proxy. → **ADR-006**.

---

## 5. Arquitectura de integración

Todas las integraciones externas se resuelven **desde el backend**, nunca desde el frontend directamente, para no exponer credenciales y centralizar logging/auditoría:

| Interfaz | Dirección | Patrón |
|---|---|---|
| IF-001 IA Provider | Backend → proveedor | Fachada de servicio (`ia.service`), respuesta logueada en Mongo `analisis_ia` |
| IF-002 n8n Webhooks | Backend → n8n | Backend dispara webhook ante cambios de estado (donación/solicitud/trueque); n8n orquesta acciones asíncronas |
| IF-003 Cloudinary | Frontend → Cloudinary (upload firmado) | Backend solo emite firma de subida (signed upload); el binario de la imagen nunca pasa por el backend, solo la URL resultante se persiste (§5.3, "no almacenar imágenes como BLOB") → **ADR-009** |
| IF-004 PostgreSQL | Backend → Postgres | ORM (ver sección 9) |
| IF-005 MongoDB | Backend → MongoDB | ODM (ver sección 9) |
| IF-006 Mapas | Frontend (visualización) + Backend (cálculo de distancia para matching, RF-016) | Híbrido: mapa interactivo en cliente, lógica de distancia server-side para consistencia del algoritmo de matching |

---

## 6. Arquitectura de IA

El backend actúa como **fachada única** hacia el proveedor de IA (RF-014, RF-015, RF-016):

- Ningún llamado a IA se hace desde el frontend; el `IA_API_KEY` nunca se expone al cliente. → **ADR-010**.
- Todo prompt/respuesta se registra en MongoDB (`chatbot_conversaciones`, `analisis_ia`, `analisis_imagenes`) ya definidas en §7.1.2 del SRS.
- **Humano en el loop:** dado que el sistema "no verificará legalmente la condición socioeconómica del beneficiario" (§1.2) y la IA no certifica nada, toda sugerencia de IA (categoría, descripción, prioridad, match) se presenta como **propuesta editable**, no como escritura automática — el usuario debe confirmar antes de persistir en Postgres.
- Diseño detallado de prompts, estrategia de clasificación y matching se formaliza en **Fase 7**.

---

## 7. Arquitectura de automatización

n8n como capa de orquestación asíncrona, desacoplada del flujo síncrono de la API:

- Backend dispara webhooks hacia n8n ante cambios de estado relevantes (solicitud aceptada, trueque con propuesta, donación cambia de estado — RF-020).
- n8n resuelve el fan-out hacia canales de notificación. **Nota:** el SRS menciona "notificaciones" (RF-020) sin especificar el canal (¿in-app, email, push?) — queda como pregunta abierta para Fase 8, no se asume ninguno.
- Los resultados de ejecución de workflows se registran en MongoDB `logs_n8n` (§7.1.2).
- Diseño detallado de flujos se formaliza en **Fase 8**.

---

## 8. Arquitectura de persistencia

Principio de frontera (ya establecido en Fase 0, regla de negocio #11, BD-005):

- **PostgreSQL 18.3 = fuente de verdad transaccional**: usuarios, ubicaciones, categorías, donaciones, solicitudes, trueques, propuestas, ofertas, entregas, imágenes (metadatos/URL) — todo lo que define el **estado del negocio**.
- **MongoDB 8.3.4 = datos flexibles/observabilidad**: conversaciones de chatbot, resultados de IA, logs de n8n, eventos del sistema, análisis de imágenes — nunca autoritativo sobre el estado del negocio.
- **Relación entre motores:** exclusivamente por ID de referencia (`usuarioId`, `entidadId`), nunca joins directos ni transacciones distribuidas entre ambos motores.
- Diseño detallado de modelo ER, índices y normalización se formaliza en **Fase 3**.

---

## 9. Arquitectura Frontend — Funcional + Feature-Based + Componentes Reutilizables

React + Vite, SPA responsiva 320px–2560px (RNF-007). **Refinamiento de esta sección (2026-07-07, a pedido explícito del usuario: "Frontend: arquitectura funcional + feature-based architecture + componentes reutilizables"):** se formalizan **3 pilares explícitos**, cada uno resolviendo un problema distinto — no son alternativas entre sí:

| Pilar | Resuelve |
|---|---|
| **Feature-based** | Cómo se organiza el código por dominio (antes llamado "Modular" en la versión previa de esta sección — mismo concepto, terminología alineada al pedido del usuario) |
| **Funcional** | Cómo se escribe el código dentro de cada módulo (estilo, no ubicación) |
| **Componentes reutilizables** | Qué piezas de UI se comparten entre módulos y bajo qué regla — antes solo mencionado de paso (`shared/components`), ahora un pilar propio con estructura y criterio explícitos |

### 9.1 Feature-based architecture

Cada módulo (`features/<dominio>/`) agrupa todo lo que le pertenece — componentes, hooks, cliente API y tipos — sin dispersarse en carpetas técnicas globales, espejo directo de los Bounded Contexts del backend (Fase 2/6):

```
src/
├── features/                    ← un módulo por Bounded Context (mismos nombres que Fase 2/6)
│   ├── donaciones/
│   │   ├── components/          (componentes específicos de este dominio: DonacionWizard, ...)
│   │   ├── hooks/                (useDonaciones, useCrearDonacion, ...)
│   │   ├── api/                  (donaciones.api.ts — cliente HTTP del módulo)
│   │   └── types/
│   ├── solicitudes/  (misma forma)
│   ├── trueques/
│   ├── identidad/     (auth, perfil, ubicación)
│   ├── entregas/
│   ├── mensajeria/
│   ├── notificaciones/
│   ├── chatbot/
│   ├── administracion/
│   └── dashboard/
├── shared/                       ← ver 9.3, componentes reutilizables
│   ├── hooks/                     (useAuth, useApiClient)
│   └── lib/                       (cliente HTTP centralizado, utilidades puras)
└── app/                           (routing, layout shell, providers globales)
```

### 9.2 Arquitectura funcional

Dentro de cada módulo, el estilo de código es funcional, no orientado a objetos/clases:
- Solo function components (nunca clases) — ya es el estándar de React, aquí se fija como regla explícita del proyecto.
- La lógica de negocio del front (no solo el fetching) se extrae a **hooks personalizados puros y testeables** — un componente no debe contener lógica que no sea de presentación.
- Composición sobre herencia; funciones puras para cualquier transformación/derivación de datos (ej. mapear estado de negocio → color semántico, Fase 5 sección 4.2).
- **Se cierra la decisión diferida de data-fetching** (antes pospuesta a Fase 6): **TanStack Query** para todo el estado de servidor — encaja naturalmente con el estilo funcional (hooks puros, sin stores globales mutables). Estado de UI puramente local (ej. paso actual del wizard) usa `useState`/`useReducer`, sin librería global adicional (no se justifica Redux/Zustand para este MVP).

### 9.3 Componentes reutilizables

`shared/components/` organizado por **nivel atómico** (mismos 3 niveles ya usados informalmente en el inventario de Fase 5, sección 3, ahora formalizados como estructura de carpetas):

```
shared/components/
├── atoms/        (Button, Input, TextArea, Select, StatusBadge, Avatar)
├── molecules/     (FormField, PublicacionCard, Stepper, ImageUploader, LocationPicker, IASuggestionBox, Modal, Toast)
└── organisms/      (Navbar, Sidebar, BottomTabBar, FiltroPanel, ChatWidget, ConversationThread, DashboardStatTile)
```

**Regla de reutilización (qué va en `shared/` vs. en un `features/<dominio>/components/`):** un componente vive en `shared/components/` **solo si es puramente presentacional** — recibe todo por props, nunca importa un hook o cliente API de un `features/*` específico. `PublicacionCard`, `ImageUploader`, `LocationPicker` e `IASuggestionBox` califican porque los usan 3 dominios distintos (donación, solicitud, trueque) con los mismos datos de forma (foto, título, badge, ubicación) — cada `feature` los consume pasándoles sus propios datos vía su propio hook local (`useDonaciones`, `useSolicitudes`...), el componente no sabe de qué dominio vienen los datos. Un componente que sí necesita lógica de un solo dominio (ej. `DonacionWizard`, que orquesta los 5 pasos específicos de RF-005/006/007) vive dentro de `features/donaciones/components/`, aunque internamente componga piezas de `shared/`.

→ **ADR-043** (feature-based + funcional), refinado por **ADR-045** (componentes reutilizables como pilar explícito).

---

## 10. Arquitectura Backend — Hexagonal + DDD + Clean Architecture

**Corrección de esta sección (2026-07-07, a pedido explícito del usuario: "Arquitectura Hexagonal + DDD + Clean Architecture PARA EL API"):** se refina ADR-042 (que ya fijaba Hexagonal por módulo) explicitando las **4 capas de Clean Architecture** dentro de cada módulo, con DDD (Fase 2) como fuente de los patrones tácticos del núcleo y Hexagonal como el vocabulario de puertos/adaptadores que conecta las capas. Las tres no compiten entre sí — se combinan porque resuelven problemas distintos: **DDD** dice *qué* modelar (Aggregates, VOs, eventos, lenguaje ubicuo — ya hecho en Fase 2); **Clean Architecture** dice *cómo* organizar las capas y la regla de dependencia; **Hexagonal** dice *cómo* el núcleo se conecta con el mundo exterior (puertos y adaptadores). No es trabajo adicional real — es la misma arquitectura de ADR-042, con un nivel más de precisión en el árbol de carpetas.

**Regla de dependencia (Clean Architecture — "The Dependency Rule"):** el código fuente solo puede depender **hacia adentro**. `domain` no depende de nada. `application` depende solo de `domain`. `adapters` depende de `application` y `domain` (los implementa). `main` (capa más externa) es el único punto que conoce Express, el cliente concreto de Prisma/Mongoose y arma la inyección de dependencias — nunca al revés.

```
┌─────────────────────────────────────────────────────────────────┐
│ main/  (Frameworks & Drivers — composition root)                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ adapters/  (Interface Adapters = Adaptadores Hexagonales)   │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ application/  (Use Cases)                             │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │ domain/  (Entities — DDD táctico + puertos)     │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
   Las flechas de dependencia siempre apuntan hacia el centro ▲
```

**Árbol de carpetas — layer-first (2026-07-08, a pedido explícito del usuario):** las 4 capas van **directamente al tope de `backend/`** (`backend/domain`, `backend/application`, `backend/adapters`, `backend/main`), no anidadas dentro de `src/modules/<contexto>/`. Cada Bounded Context (Fase 2) es una **subcarpeta dentro de cada capa**, no al revés — así el patrón de capas es visible de inmediato al abrir el proyecto, y agregar un módulo nuevo (donaciones, solicitudes...) significa agregar una subcarpeta con el mismo nombre en `domain/`, `application/` y `adapters/`. El monolito modular de ADR-007 no cambia — los módulos siguen siendo las mismas fronteras de Bounded Context, solo cambia el nivel en el que se anida la capa vs. el módulo.

```
backend/
├── domain/                           ← Capa 1: Entities (Clean) — táctica DDD (Fase 2)
│   └── <bounded-context>/              (ej. identidad, donaciones, solicitudes, trueques...)
│       ├── entities/                     (Aggregate Root + entidades hijas: Usuario, Donacion...)
│       ├── value-objects/                (Rol, EstadoDonacion, Urgencia, Ubicacion...)
│       ├── events/                       (eventos de dominio, Fase 2 sección 7)
│       ├── services/                     (Domain Services: lógica que cruza aggregates)
│       └── ports/                        (interfaces: IUsuarioRepository, IIAProvider... — puertos de salida)
│
├── application/                      ← Capa 2: Use Cases (Clean)
│   └── <bounded-context>/
│       ├── use-cases/                    (RegistrarUsuarioUseCase, PublicarDonacionUseCase...)
│       └── dtos/                         (DTOs internos de aplicación, independientes del transporte HTTP)
│
├── adapters/                         ← Capa 3: Interface Adapters (Clean) = Adaptadores (Hexagonal)
│   └── <bounded-context>/
│       ├── controllers/                  (entrada: traduce HTTP → invocación de caso de uso)
│       ├── repositories/                 (salida: implementa los puertos de domain/ports con Prisma/Mongoose)
│       ├── security/                     (salida: bcrypt, JWT — solo en identidad)
│       └── external/                     (salida: Claude/Cloudinary/Mapas/n8n — solo en los módulos que los declaran)
│
└── main/                              ← Capa 4: Frameworks & Drivers (Clean) — composition root único, no se repite por módulo
    ├── express-app.ts                    (instancia Express, monta middlewares globales de Fase 6/9)
    ├── prisma-client.ts                   (instancia única de PrismaClient)
    ├── mongoose-connection.ts
    ├── env.ts, logger.ts
    ├── di-container.ts                    (wiring: qué adaptador concreto se inyecta en cada caso de uso)
    ├── middlewares/                       (auth, rbac, error-handler — Fase 9)
    └── routes/<bounded-context>.routes.ts (por módulo: conecta verbos HTTP → controller)
```

**Resolución de imports entre capas:** dado que `domain/identidad/` y `application/identidad/` ya no son carpetas vecinas (viven bajo raíces distintas), los imports que cruzan de capa usan **path aliases de TypeScript** (`@domain/*`, `@application/*`, `@adapters/*`, `@main/*`) en vez de rutas relativas largas (`../../../domain/...`) — configurados en `tsconfig.json` (`paths`) y resueltos en el build de producción con `tsc-alias` (ya que `tsc` no reescribe alias en el JS compilado). Los imports **dentro** de una misma capa/módulo (ej. `domain/identidad/entities/` → `domain/identidad/value-objects/`) siguen usando rutas relativas simples, sin alias.

**Mapeo de conceptos** (para que quede trazable qué patrón aporta qué):

| Concepto | DDD (Fase 2) | Anillo de Clean Architecture | Rol Hexagonal | Carpeta |
|---|---|---|---|---|
| Aggregate Root / Entidad | Aggregate, Entidad | 1. Entities | Núcleo | `domain/<contexto>/entities/` |
| Value Object | Value Object | 1. Entities | Núcleo | `domain/<contexto>/value-objects/` |
| Evento de dominio | Domain Event | 1. Entities | Núcleo | `domain/<contexto>/events/` |
| Lógica que cruza aggregates | Domain Service | 1. Entities | Núcleo | `domain/<contexto>/services/` |
| Contrato de persistencia | Repository (interfaz) | 1. Entities (la interfaz vive en el núcleo, no la implementación) | Puerto de salida | `domain/<contexto>/ports/` |
| Acción del sistema | Application Service | 2. Use Cases | Puerto de entrada + su lógica | `application/<contexto>/use-cases/` |
| Controller HTTP | — | 3. Interface Adapters | Adaptador de entrada (driving) | `adapters/<contexto>/controllers/` |
| Implementación de Repository | Repository (implementación) | 3. Interface Adapters ("Gateway") | Adaptador de salida (driven) | `adapters/<contexto>/repositories/` |
| Cliente de IA/Cloudinary/Mapas/n8n/bcrypt/JWT | — | 3. Interface Adapters | Adaptador de salida (driven) | `adapters/<contexto>/external/` o `security/` |
| Express app, cliente Prisma, DI | — | 4. Frameworks & Drivers | Infraestructura pura / composition root | `main/` |

**Beneficio concreto para este proyecto:** `domain` y `application` se prueban (Fase 6, sección 9) sustituyendo los adaptadores por dobles en memoria, sin levantar Postgres/MongoDB/Claude reales — relevante dado el plazo de 6 semanas. El `main/di-container.ts` centralizado evita duplicar configuración de Express/Prisma en cada uno de los ~10 módulos. La estructura layer-first hace el patrón arquitectónico visible desde el primer nivel de carpetas, sin tener que entrar a un módulo específico para verlo.

**ORM/ODM** (sin cambios, ya decidido — ADR-008): Prisma para PostgreSQL, Mongoose para MongoDB, instanciados en `main/` e inyectados en los adaptadores de `adapters/<contexto>/repositories/`.

→ **ADR-042** (Hexagonal por módulo) refinado por **ADR-044** (4 capas explícitas de Clean Architecture) y por **ADR-046** (estructura layer-first: capas al tope de `backend/`, Bounded Context como subcarpeta dentro de cada capa, en vez de al revés).

---

## Diagrama de contexto actualizado

```
Donante / Beneficiario / Comunidad
        │ HTTPS(dev: HTTP)/JSON
        ▼
[React + Vite SPA] ──────────────► [Cloudinary] (upload firmado directo)
        │
        ▼
[Node.js + Express API]  (localhost, Docker Compose)
        │
        ├── PostgreSQL 18.3  — usuarios, donaciones, solicitudes, trueques, estados
        ├── MongoDB 8.3.4      — chatbot, IA, logs, eventos
        ├── n8n (webhooks)   — automatizaciones asíncronas
        ├── Proveedor IA     — chatbot, clasificación, matching
        └── Servicio Mapas   — geolocalización, distancia
        │
        ▼
Administrador — moderación y reportes (RF-018)
```

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-006 — Excepción de HTTPS en entorno localhost académico.
- ADR-007 — Monolito modular en lugar de microservicios.
- ADR-008 — Prisma (Postgres) + Mongoose (MongoDB) como ORM/ODM.
- ADR-009 — Carga de imágenes vía upload firmado directo a Cloudinary desde el frontend.
- ADR-010 — Todas las llamadas a IA se resuelven server-side, nunca desde el frontend.

## Preguntas abiertas para fases siguientes
- Canal real de notificaciones (RF-020): in-app / email / push — a definir en Fase 8.
- Librería de estado/data-fetching en frontend — a definir en Fase 6.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
