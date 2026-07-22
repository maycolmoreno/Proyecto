# 00 — Inventario del Proyecto — DonaConnect Ecuador

**Tipo de documento:** inventario técnico de solo lectura, primer entregable de la auditoría de defensa (ver `docs/INDEX.md` para el resto del plan de diseño; este documento y sus dos acompañantes — `02_TRAZABILIDAD_SRS_CODIGO.md`, `03_ARQUITECTURA.md` — son la "fase 1" de la auditoría, según lo pedido explícitamente: presentar primero el mapa completo del sistema antes de bajar a análisis línea por línea).

**Fecha de generación:** 2026-07-18. **Metodología:** lectura directa de archivos reales (Read/Grep/Glob) + 3 subagentes de exploración en paralelo, cada uno verificando código contra documentación previa (`docs/MANUAL_DEFENSA_PROYECTO.md` del 2026-07-16 y `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md` del 2026-07-10). Ninguna afirmación de este documento proviene solo de la documentación sin contrastarse contra el código — donde la documentación y el código difieren, se señala explícitamente (ver `02_TRAZABILIDAD_SRS_CODIGO.md` §Inconsistencias).

**Estado del working tree en el momento de esta auditoría:** ~45 archivos modificados y ~20 sin trackear en `git status` (rama `master`, último commit `5899caf "Quitar n8n"`). Todo el trabajo de "Perfiles Funcionales" (ADR-048/049) y el nuevo módulo `publicaciones` (historial) está en disco pero **sin commitear**. Este inventario describe el código **en disco**, no solo lo que hay en el último commit.

---

## 1. Visión general de carpetas raíz

| Elemento | Tecnología | Ruta | Responsabilidad | Estado |
|---|---|---|---|---|
| Backend | Node.js 22 + TypeScript 5.7 + Express 4.21 | `backend/` | API REST, lógica de negocio, persistencia | Implementado |
| Frontend | React 18.3 + Vite 6.0 + TypeScript | `frontend/` | SPA, consumo de API | Implementado |
| Documentación de diseño | Markdown | `docs/fases/*.md` (14 fases) | Diseño congelado, pre-código, aprobado 2026-07-07 | Documentado (fuente histórica) |
| Log de decisiones | Markdown | `docs/DECISIONES.md` | 49 ADR (000-049), fuente de verdad de trade-offs | Vigente, verificado contra código en esta auditoría |
| Documentos de extensión post-MVP | Markdown | `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md`, `docs/DISENO_MODELO_PERFILES.md`, `docs/PLAN_PERFILES.md`, `docs/MANUAL_DEFENSA_PROYECTO.md` | Auditoría, diseño y ejecución de "Perfiles Funcionales" (ADR-048/049) | El más antiguo (2026-07-10) está parcialmente desactualizado — ver §Inconsistencias en `02_TRAZABILIDAD_SRS_CODIGO.md` |
| Orquestación | Docker Compose | `docker-compose.yml` | 4 servicios: `postgres`, `mongo`, `api`, `web` | Implementado |
| CI | GitHub Actions | `.github/workflows/ci.yml` | install→lint→typecheck→test→build (3 jobs: backend, backend-test, frontend), sin CD | Implementado |
| Fuente de requisitos | Word (.docx) | `SRS_DonaConnect_Ecuador_ISO29148.docx` | SRS original v1.0, no se modifica | Fuente única, referenciada por ADR |
| Variables de entorno de ejemplo | `.env.example` | raíz | Plantilla de configuración | Implementado (11 variables, ver `03_ARQUITECTURA.md` §Seguridad) |

No existe `package.json` en la raíz del repo — backend y frontend son proyectos npm independientes, sin monorepo (Lerna/Turborepo/workspaces). No hay indicios de esto en ningún ADR; es simplemente la estructura real.

---

## 2. Backend — las 4 capas y sus 12 Bounded Contexts

Confirmado por listado real de directorios (`find backend/{domain,application,adapters,main} -maxdepth 2 -type d`):

```
backend/
├── domain/         entidades, value objects, puertos (interfaces), domain services — 12 BC
├── application/    casos de uso — 12 BC
├── adapters/       controllers HTTP, repositorios Prisma/Mongoose, clientes externos — 12 BC
└── main/           composition root: express-app.ts, di-container.ts, routes/, middlewares/, env.ts
```

**12 Bounded Contexts** (subcarpeta repetida en las 3 primeras capas): `identidad`, `categorias`, `donaciones`, `solicitudes`, `trueques`, `entregas`, `ia`, `administracion`, `notificaciones`, `mensajeria`, `dashboard`, **`publicaciones`** (nuevo, sin commitear — ver más abajo). Más `auditoria` y `eventos` como infraestructura transversal (sin caso de uso propio, son servicios de soporte usados por los demás módulos).

| Elemento | Tecnología | Ruta | Responsabilidad | Estado |
|---|---|---|---|---|
| Composition root | TypeScript | `backend/main/di-container.ts` | Cablea TODOS los adaptadores concretos en cada puerto; único lugar que conoce las 4 capas | Implementado |
| App Express | Express | `backend/main/express-app.ts` | Registra Helmet, CORS, 12 routers, error handler global | Implementado |
| Rutas | Express Router | `backend/main/routes/*.ts` (12 archivos) | Un archivo por BC, define método+path+middlewares+controller | Implementado |
| Middlewares | TypeScript | `backend/main/middlewares/` | `auth`, `perfil` (nuevo, ADR-048), `rbac`, `audit`, `error-handler` | Implementado |
| Módulo Identidad | Prisma (Postgres) | `domain/application/adapters/identidad` | Registro, login, JWT, bcrypt, perfiles funcionales | Implementado |
| Módulo Donaciones | Prisma (Postgres) | `.../donaciones` | Publicar/listar/cancelar donación, imágenes | Implementado |
| Módulo Solicitudes | Prisma (Postgres) | `.../solicitudes` | Crear solicitud, ofertar, aceptar (1 paso) | Implementado |
| Módulo Trueques | Prisma (Postgres) | `.../trueques` | Publicar, proponer, negociar (2 pasos) | Implementado |
| Módulo Entregas | Prisma (Postgres) | `.../entregas` | Coordinación polimórfica Donación/Trueque | Implementado |
| Módulo IA | Gemini (`@google/genai`) | `.../ia` | Chatbot, clasificación, matching, moderación | Implementado (proveedor real ≠ ADR-024, ver §Inconsistencias) |
| Módulo Administración | Prisma (Postgres) | `.../administracion` | Moderación de publicaciones/usuarios | Implementado |
| Módulo Notificaciones | Mongoose (Mongo) | `.../notificaciones` | Feed in-app, sin correo (n8n removido) | Implementado |
| Módulo Mensajería | Mongoose (Mongo) | `.../mensajeria` | Chat usuario↔usuario | Implementado |
| Módulo Dashboard | Prisma + Mongoose | `.../dashboard` | KPIs de impacto social | Implementado |
| **Módulo Publicaciones** | Mongoose (Mongo) | `.../publicaciones` | Proyección "mis publicaciones" (historial unificado) | **Implementado, sin commitear, sin ADR propio** — ver nota abajo |
| Auditoría (transversal) | Prisma (Postgres) | `domain/auditoria`, `adapters/auditoria` | Log de acciones sensibles | Implementado |
| Event Bus (transversal) | `node:events` | `domain/eventos`, `main/event-bus.ts` | 14 eventos de dominio, in-process | Implementado |

### Nota — módulo `publicaciones` (hallazgo de esta auditoría)

Existe un Bounded Context completo (`backend/domain/publicaciones/`, `backend/application/publicaciones/`, `backend/adapters/publicaciones/`) que **no aparece en ningún ADR de `docs/DECISIONES.md`** ni en `docs/MANUAL_DEFENSA_PROYECTO.md`. Implementa exactamente el "historial/mis publicaciones" que tanto `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md` §9 (tabla GAP) como el propio ADR-048 (línea de "Estado") señalaban como pendiente ("Fase 5 del diseño... queda fuera de este ADR"). Está cableado end-to-end: ruta `GET /publicaciones/mias` (`backend/main/routes/publicaciones.routes.ts:9`), montada en `express-app.ts:51`, con listener del Event Bus (`PublicacionIndexService`, 8 suscripciones en `di-container.ts:405-419`) que mantiene una colección Mongo nueva `publicaciones_index`, y consumida en el frontend por `MisPublicacionesPage.tsx` (ruta `/publicaciones/mias` en `App.tsx:51`). **Clasificación:** Hecho comprobado — funcionalidad real y funcional, pero código en progreso sin registrar formalmente (sin commit, sin ADR).

---

## 3. Frontend — arquitectura feature-based

```
frontend/src/
├── app/            App.tsx (rutas), layouts/ (AppShell, RutaProtegida), pages/ (17 páginas)
├── features/<dominio>/   13 módulos: administracion, categorias, chatbot, dashboard, donaciones,
│                          entregas, ia, identidad, mensajeria, notificaciones, solicitudes,
│                          trueques, publicaciones (nuevo)
└── shared/
    ├── components/{atoms,molecules,organisms}/   componentes puramente presentacionales
    ├── hooks/
    └── lib/         http-client.ts, ubicacion.ts, nav-items.ts, etc.
```

| Elemento | Tecnología | Ruta | Responsabilidad | Estado |
|---|---|---|---|---|
| Enrutamiento | React Router 7.1 | `frontend/src/app/App.tsx` (61 líneas) | 18 rutas declaradas | Implementado |
| Guard de sesión | Componente propio | `app/layouts/RutaProtegida.tsx` | Exige token, sin distinción de rol/perfil | Implementado |
| Estado de servidor | TanStack Query 5.62 | en cada `features/*/api/` | Cache, invalidación, refetch | Implementado |
| Cliente HTTP | `fetch` propio | `shared/lib/http-client.ts` | Normaliza errores a `ApiError`, adjunta JWT | Implementado |
| Páginas (17) | React function components | `app/pages/*.tsx` | Ver detalle completo en `02_TRAZABILIDAD_SRS_CODIGO.md` | 16 implementadas + `MisPublicacionesPage.tsx` sin commitear |
| Componentes compartidos | React | `shared/components/{atoms,molecules,organisms}/` | `PublicacionCard`, `FiltroPanel`, `Stepper`, `ImageUploader`, `LocationPicker`, `Modal`, `StatusBadge`, `IASuggestionBox` | Implementado |
| Wizards de publicación (3) | React | `features/{donaciones,solicitudes,trueques}/components/*Wizard.tsx` | 5 pasos, sugerencia IA en el último | Implementado (con asimetría en manejo de imágenes, ver §Inconsistencias) |
| Chatbot | React | `features/chatbot/components/ChatWidget.tsx` + `app/pages/ChatbotPage.tsx` | Widget flotante + vista completa | Implementado, sin manejo de errores (ver §Inconsistencias) |
| Navegación | Componente propio | `shared/lib/nav-items.ts`, `Sidebar.tsx`, `BottomTabBar.tsx`, `Navbar.tsx` | 7 ítems, igual para todo usuario autenticado (no filtra por rol/perfil) | Implementado |

---

## 4. Persistencia

### PostgreSQL — 11 tablas (Prisma, `backend/prisma/schema.prisma`, 368 líneas)

`usuarios`, `usuarios_perfiles` (nueva, ADR-048), `ubicaciones`, `categorias`, `donaciones`, `imagenes`, `solicitudes`, `ofertas_solicitud`, `entregas`, `trueques`, `propuestas_trueque`, `auditoria`. Detalle completo (columnas, enums, índices) en `03_ARQUITECTURA.md` §Datos.

### MongoDB — 6 colecciones (Mongoose, sin `mongoose.Schema` estricto en todos los campos)

`analisis_ia`, `chatbot_conversaciones`, `mensajes`, `eventos_sistema` (único con TTL: 90 días), `notificaciones`, **`publicaciones_index`** (6ª colección, nueva y sin commitear — ni `docs/AUDITORIA_FUNCIONAL_MARKETPLACE.md` [que dice "5 colecciones"] ni `docs/MANUAL_DEFENSA_PROYECTO.md` la mencionan).

---

## 5. Docker

| Servicio | Imagen | Puerto host→contenedor | Healthcheck | Notas |
|---|---|---|---|---|
| `postgres` | `postgres:18.3-alpine` | 5433→5432 | `pg_isready` | `api` espera a que pase (`depends_on: condition: service_healthy`) |
| `mongo` | `mongo:8.3.4` | 27017→27017 | `mongosh --eval db.adminCommand('ping')` | Sin dependencia declarada de `api` |
| `api` | build `./backend` | 4000→4000 | — (sin healthcheck propio) | `Dockerfile`: `node:22-alpine`, corre `prisma generate && prisma migrate deploy && npm run dev` en cada arranque |
| `web` | build `./frontend` | 5173→5173 | — (sin healthcheck propio) | `Dockerfile`: `node:22-alpine`, **dev server puro** (`npm run dev`), sin build de producción ni Nginx |

Red interna `donaconnect-network` (bridge). Volúmenes nombrados `postgres_data`, `mongo_data` + bind mounts de código (`./backend:/app`, `./frontend:/app`) con volumen anónimo `/app/node_modules` en ambos — patrón de hot-reload en contenedor.

---

## 6. Testing — inventario real

| Archivo | Líneas | Framework | Qué cubre |
|---|---|---|---|
| `backend/tests/helpers.ts` | 89 | — | Fixtures/personas de prueba (incluye ajuste post-ADR-049: persona `USUARIO_COMUNIDAD` ya no incluye perfil `COMUNIDAD`) |
| `backend/tests/donaciones.test.ts` | 50 | Vitest + Supertest | Flujo de Donaciones |
| `backend/tests/solicitudes.test.ts` | 97 | Vitest + Supertest | Flujo de Solicitudes/Ofertas |
| `backend/tests/trueques.test.ts` | 76 | Vitest + Supertest | Flujo de Trueques/Propuestas |
| `backend/tests/perfiles.test.ts` | 107 | Vitest + Supertest | Modelo de Perfiles Funcionales (ADR-048/049), incluye test de que `perfiles: ['COMUNIDAD']` responde 400 |
| `backend/tests/publicaciones.test.ts` | 156 | Vitest + Supertest | Módulo nuevo `publicaciones` (sin commitear) |

**No existen tests de**: Identidad (registro/login), Entregas, Mensajería, Notificaciones, IA, Categorías, Dashboard, Administración. **No existe ningún test de frontend** (sin `*.test.*`/`*.spec.*` en todo `frontend/`, sin Vitest/RTL/Playwright en `frontend/package.json`). Clasificación: **Hecho comprobado / deuda técnica** — desarrollado con más detalle en la futura entrega `16_PRUEBAS.md`.

---

## 7. Qué queda para las siguientes fases de esta auditoría

Este documento, junto con `02_TRAZABILIDAD_SRS_CODIGO.md` (matriz de los 16 CU + comparación SRS/ADR/código + lista de inconsistencias) y `03_ARQUITECTURA.md` (arquitectura real con evidencia + diagrama), completa el "mapa del sistema" pedido como primer paso. Los 20 documentos restantes del plan original (línea por línea de código, construcción desde cero, catálogo completo de librerías, catálogo completo de endpoints con ejemplos Postman, seguridad detallada, guion de exposición, banco de 80 preguntas, etc.) quedan pendientes para las siguientes fases de trabajo, tal como pediste ("Trabaja por fases para evitar documentación superficial").
